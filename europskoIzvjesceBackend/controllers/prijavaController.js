const db = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.API_KEY || 'tajnikljucApi';

function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Neautorizirano - Nema ili je pogrešan API ključ." });
  }
  next();
}

function isValidIban(iban) {
  if (!iban) return false;
  const normalizedIban = Array.isArray(iban) ? iban[0] : iban;
  if (typeof normalizedIban !== 'string') return false;
  const cleaned = normalizedIban.replace(/\s/g, "").toUpperCase();
  return /^HR\d{19}$/.test(cleaned);
}

function validatePayload(payload) {
  const requiredSegments = ['nesreca', 'vozilo', 'vozacOsiguranik', 'polica', 'osiguranje', 'opis'];
  for (const seg of requiredSegments) {
    if (!payload[seg] || typeof payload[seg] !== 'object') {
      return `Nedostaje segment podataka: ${seg}`;
    }
  }
  const osig = payload.vozacOsiguranik;
  const requiredOsigFields = [
    'ime_osiguranika', 'prezime_osiguranika', 'adresa_osiguranika',
    'postanskibroj_osiguranika', 'drzava_osiguranika', 'mail_osiguranika',
    'kontaktbroj_osiguranika', 'iban_osiguranika'
  ];
  for (const field of requiredOsigFields) {
    if (!osig[field]) return `Nedostaje podatak osiguranik.${field}`;
  }
  if (!isValidIban(osig.iban_osiguranika)) {
    return "Neispravan IBAN!";
  }
  if (!payload.nesreca.id_nesrece || typeof payload.nesreca.id_nesrece !== 'string') {
    return "Nepostavljen id (id_nesrece/sessionId)";
  }
  if (!payload.osiguranje.id_osiguranje) {
    return "Nedostaje id_osiguranje!";
  }
  return null;
}

exports.apiKeyAuth = apiKeyAuth;

// Tvoja funkcija za unos prijave
exports.createPrijava = async function (req, res) {
  const {
    nesreca, svjedoci, vozacOsiguranik, vozac, opis, vozilo,
    polica, osiguranje, potpis, slike
  } = req.body;

  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    let geoSQL = null;
    if (nesreca.geolokacija_nesrece) {
      if (
        typeof nesreca.geolokacija_nesrece === 'object' &&
        typeof nesreca.geolokacija_nesrece.x === 'number' &&
        typeof nesreca.geolokacija_nesrece.y === 'number'
      ) {
        geoSQL = `(${nesreca.geolokacija_nesrece.x},${nesreca.geolokacija_nesrece.y})`;
      } else if (typeof nesreca.geolokacija_nesrece === 'string') {
        geoSQL = nesreca.geolokacija_nesrece;
      }
    }

    await client.query(
      `INSERT INTO nesreca (
        id_nesrece, datum_nesrece, vrijeme_nesrece, mjesto_nesrece, geolokacija_nesrece,
        ozlijedeneososbe, stetanavozilima, stetanastvarima
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id_nesrece) DO NOTHING`,
      [
        nesreca.id_nesrece,
        nesreca.datum_nesrece,
        nesreca.vrijeme_nesrece,
        nesreca.mjesto_nesrece,
        geoSQL,
        nesreca.ozlijedeneososbe ?? false,
        nesreca.stetanavozilima ?? false,
        nesreca.stetanastvarima ?? false
      ]
    );

    const id_nesrece = nesreca.id_nesrece;

    await client.query(
      `INSERT INTO okolnost (tip_okolnost, opis_okolnost, id_nesrece)
       VALUES ($1,$2,$3)
       ON CONFLICT (id_nesrece)
       DO UPDATE SET opis_okolnost = EXCLUDED.opis_okolnost`,
      ['glavna', opis.opis_nesrece || '', id_nesrece]
    );

    // Svjedoci
    if (svjedoci && Array.isArray(svjedoci.lista)) {
      for (const s of svjedoci.lista) {
        await client.query(
          `INSERT INTO svjedoci (ime_prezime_svjedoci, adresa_svjedoci, kontakt_svjedoci, id_nesrece)
           VALUES (ARRAY[$1], ARRAY[$2], ARRAY[$3], $4)
           ON CONFLICT DO NOTHING`,
          [s.ime || '', s.adresa || '', s.kontakt || '', id_nesrece]
        );
      }
    }

    // Vozilo
    await client.query(
      `INSERT INTO vozilo (
        registarskaoznaka_vozila, marka_vozila, tip_vozila, drzavaregistracije_vozila,
        brojsasije_vozila, kilometraza_vozila, godinaproizvodnje_vozilo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (registarskaoznaka_vozila)
      DO UPDATE SET
        marka_vozila = EXCLUDED.marka_vozila,
        tip_vozila = EXCLUDED.tip_vozila,
        drzavaregistracije_vozila = EXCLUDED.drzavaregistracije_vozila,
        brojsasije_vozila = EXCLUDED.brojsasije_vozila,
        kilometraza_vozila = EXCLUDED.kilometraza_vozila,
        godinaproizvodnje_vozilo = EXCLUDED.godinaproizvodnje_vozilo
      `,
      [
        vozilo.registarskaoznaka_vozila,
        vozilo.marka_vozila,
        vozilo.tip_vozila,
        vozilo.drzavaregistracije_vozila,
        vozilo.brojsasije_vozila,
        vozilo.kilometraza_vozila,
        vozilo.godinaproizvodnje_vozilo
      ]
    );

    // Osiguranik
    let ibanDb = vozacOsiguranik.iban_osiguranika;
    if (Array.isArray(ibanDb)) ibanDb = ibanDb;
    else if (typeof ibanDb === 'string') ibanDb = [ibanDb.toUpperCase().replace(/\s+/g, '')];

    const osiguranikRes = await client.query(
      `INSERT INTO osiguranik (
        ime_osiguranika, prezime_osiguranika, adresa_osiguranika, postanskibroj_osiguranika,
        drzava_osiguranika, mail_osiguranika, kontaktbroj_osiguranika, iban_osiguranika
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (mail_osiguranika) DO UPDATE SET
        ime_osiguranika = EXCLUDED.ime_osiguranika,
        prezime_osiguranika = EXCLUDED.prezime_osiguranika,
        adresa_osiguranika = EXCLUDED.adresa_osiguranika,
        postanskibroj_osiguranika = EXCLUDED.postanskibroj_osiguranika,
        drzava_osiguranika = EXCLUDED.drzava_osiguranika,
        kontaktbroj_osiguranika = EXCLUDED.kontaktbroj_osiguranika,
        iban_osiguranika = EXCLUDED.iban_osiguranika
      RETURNING id_osiguranika`,
      [
        vozacOsiguranik.ime_osiguranika,
        vozacOsiguranik.prezime_osiguranika,
        vozacOsiguranik.adresa_osiguranika,
        vozacOsiguranik.postanskibroj_osiguranika,
        vozacOsiguranik.drzava_osiguranika,
        vozacOsiguranik.mail_osiguranika,
        vozacOsiguranik.kontaktbroj_osiguranika,
        ibanDb
      ]
    );
    const id_osiguranika = osiguranikRes.rows[0].id_osiguranika;

    // Polica osiguranja UPIS s FK na osiguranje
    await client.query(
      `INSERT INTO polica_osiguranja (
        brojpolice, brojzelenekarte, id_osiguranika, id_osiguranja, kaskopokrivastetu
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (brojpolice) DO UPDATE SET
        brojzelenekarte = EXCLUDED.brojzelenekarte,
        id_osiguranika = EXCLUDED.id_osiguranika,
        id_osiguranja = EXCLUDED.id_osiguranja,
        kaskopokrivastetu = EXCLUDED.kaskopokrivastetu
      `,
      [
        polica.brojpolice,
        polica.brojzelenekarte,
        id_osiguranika,
        osiguranje.id_osiguranje, // lookup FK
        polica.kaskopokrivastetu ?? false
      ]
    );

    // NE radi INSERT/UPDATE osiguranja!

    // Insert slike
    if (Array.isArray(slike)) {
      for (const s of slike) {
        const buff = Buffer.from(s.buffer, 'base64');
        await client.query(
          `INSERT INTO slika (naziv_slike, podatak_slike, vrijeme_slikanja, id_nesrece)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING`,
          [s.naziv_slike, buff, s.vrijeme_slikanja, id_nesrece]
        );
      }
    }

    // Potpisi
    await client.query(
      `UPDATE nesreca SET potpis_a = $1, potpis_b = $2 WHERE id_nesrece = $3`,
      [
        potpis?.potpis_a ? Buffer.from(potpis.potpis_a, 'base64') : null,
        potpis?.potpis_b ? Buffer.from(potpis.potpis_b, 'base64') : null,
        id_nesrece
      ]
    );

    await client.query('COMMIT');
    return res.json({ success: true, nesrecaId: id_nesrece });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ error: error.message || "Greška na serveru" });
  } finally {
    client.release();
  }
};
