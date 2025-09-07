const db = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const ALLOWED_API_KEY = process.env.API_KEY || 'tajni-api-kljuc';

function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== ALLOWED_API_KEY) {
    return res.status(401).json({ error: "Neautorizirano - Nema ili je pogrešan API ključ." });
  }
  next();
}

function isValidIban(iban) {
  return typeof iban === "string" && /^HR\d{19}$/.test(iban.replace(/\s/g,"").toUpperCase());
}

function validatePayload(payload) {
  const requiredSegments = ['nesreca', 'vozilo', 'vozacPolica', 'polica', 'osiguranje', 'opis'];
  for (const key of requiredSegments) {
    if (!payload[key] || typeof payload[key] !== 'object') {
      return `Nedostaje segment podataka: ${key}`;
    }
  }
  const osig = payload.vozacPolica || {};
  const osigReq = [
    'ime_osiguranika', 'prezime_osiguranika', 'adresa_osiguranika', 'postanskibroj_osiguranika',
    'drzava_osiguranika', 'mail_osiguranika', 'kontaktbroj_osiguranika', 'iban_osiguranika'
  ];
  for (const key of osigReq) {
    if (!osig[key]) return `Nedostaje podatak osiguranik.${key}`;
  }
  if (!isValidIban(osig.iban_osiguranika)) return "Neispravan IBAN!";
  return null;
}

exports.apiKeyAuth = apiKeyAuth;

exports.createPrijava = async (req, res) => {
  const { nesreca, svjedoci, vozacPolica, vozac, opis, vozilo, osiguranje, polica, potpis, slike } = req.body;
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const client = await db.connect();

  let vozacToStore = vozac;
  if (!vozacToStore || Object.keys(vozacToStore).length === 0) {
    vozacToStore = {
      ime_vozaca: vozacPolica.ime_osiguranika,
      prezime_vozaca: vozacPolica.prezime_osiguranika,
      adresa_vozaca: vozacPolica.adresa_osiguranika,
      postanskibroj_vozaca: vozacPolica.postanskibroj_osiguranika,
      drzava_vozaca: vozacPolica.drzava_osiguranika,
      mail_vozaca: vozacPolica.mail_osiguranika,
      kontaktbroj_vozaca: vozacPolica.kontaktbroj_osiguranika,
      brojvozackedozvole: vozacPolica.brojvozackedozvole || null,
      kategorijavozackedozvole: vozacPolica.kategorijavozackedozvole || null,
      valjanostvozackedozvole: vozacPolica.valjanostvozackedozvole || null
    };
  }

  try {
    await client.query('BEGIN');

    // 1. NESRECA (upsert)
    const nesrecaRes = await client.query(
      `INSERT INTO nesreca (
        datum_nesrece, vrijeme_nesrece, mjesto_nesrece, geolokacija_nesrece,
        ozlijedeneososbe, stetanavozilima, stetanastvarima
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (datum_nesrece, vrijeme_nesrece, mjesto_nesrece)
      DO UPDATE SET
        geolokacija_nesrece = EXCLUDED.geolokacija_nesrece,
        ozlijedeneososbe = EXCLUDED.ozlijedeneososbe,
        stetanavozilima = EXCLUDED.stetanavozilima,
        stetanastvarima = EXCLUDED.stetanastvarima
      RETURNING id_nesrece`,
      [
        nesreca.datum_nesrece,
        nesreca.vrijeme_nesrece,
        nesreca.mjesto_nesrece,
        nesreca.geolokacija_nesrece,
        nesreca.ozlijedeneososbe ?? false,
        nesreca.stetanavozilima ?? false,
        nesreca.stetanastvarima ?? false
      ]
    );
    const id_nesrece = nesrecaRes.rows[0].id_nesrece;

    // 2. OPIS/OKOLNOST
    await client.query(
      `INSERT INTO okolnost (tip_okolnost, opis_okolnost, id_nesrece)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_nesrece)
       DO UPDATE SET opis_okolnost = EXCLUDED.opis_okolnost`,
      ['glavna', opis.opis_okolnost || '', id_nesrece]
    );

    // 3. SVJEDOCI
    if (svjedoci?.lista?.length) {
      for (const s of svjedoci.lista) {
        await client.query(
          `INSERT INTO svjedok (ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok, id_nesrece)
           VALUES (ARRAY[$1], ARRAY[$2], ARRAY[$3], $4)
           ON CONFLICT DO NOTHING`,
          [s.ime, s.adresa, s.kontakt, id_nesrece]
        );
      }
    }

    // 4. VOZILO
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

    // 5. OSIGURANIK
    const osiguranikRes = await client.query(
      `INSERT INTO osiguranik (
        ime_osiguranika, prezime_osiguranika, adresa_osiguranika, postanskibroj_osiguranika,
        drzava_osiguranika, mail_osiguranika, kontaktbroj_osiguranika
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (mail_osiguranika)
      DO UPDATE SET
        ime_osiguranika = EXCLUDED.ime_osiguranika,
        prezime_osiguranika = EXCLUDED.prezime_osiguranika,
        adresa_osiguranika = EXCLUDED.adresa_osiguranika,
        postanskibroj_osiguranika = EXCLUDED.postanskibroj_osiguranika,
        drzava_osiguranika = EXCLUDED.drzava_osiguranika,
        kontaktbroj_osiguranika = EXCLUDED.kontaktbroj_osiguranika
      RETURNING id_osiguranika`,
      [
        vozacPolica.ime_osiguranika,
        vozacPolica.prezime_osiguranika,
        vozacPolica.adresa_osiguranika,
        vozacPolica.postanskibroj_osiguranika,
        vozacPolica.drzava_osiguranika,
        vozacPolica.mail_osiguranika,
        vozacPolica.kontaktbroj_osiguranika
      ]
    );
    const id_osiguranika = osiguranikRes.rows[0].id_osiguranika;

    // 6. VOZAČ
    await client.query(
      `INSERT INTO vozac (
        ime_vozaca, prezime_vozaca, adresa_vozaca, postanskibroj_vozaca,
        drzava_vozaca, mail_vozaca, kontaktbroj_vozaca,
        brojvozackedozvole, kategorijavozackedozvole, valjanostvozackedozvole
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (mail_vozaca)
      DO UPDATE SET
        ime_vozaca = EXCLUDED.ime_vozaca,
        prezime_vozaca = EXCLUDED.prezime_vozaca,
        adresa_vozaca = EXCLUDED.adresa_vozaca,
        postanskibroj_vozaca = EXCLUDED.postanskibroj_vozaca,
        drzava_vozaca = EXCLUDED.drzava_vozaca,
        kontaktbroj_vozaca = EXCLUDED.kontaktbroj_vozaca,
        brojvozackedozvole = EXCLUDED.brojvozackedozvole,
        kategorijavozackedozvole = EXCLUDED.kategorijavozackedozvole,
        valjanostvozackedozvole = EXCLUDED.valjanostvozackedozvole
      `,
      [
        vozacToStore.ime_vozaca,
        vozacToStore.prezime_vozaca,
        vozacToStore.adresa_vozaca,
        vozacToStore.postanskibroj_vozaca,
        vozacToStore.drzava_vozaca,
        vozacToStore.mail_vozaca,
        vozacToStore.kontaktbroj_vozaca,
        vozacToStore.brojvozackedozvole || null,
        vozacToStore.kategorijavozackedozvole || null,
        vozacToStore.valjanostvozackedozvole || null
      ]
    );

    // 7. POLICA_OSIGURANJA
    await client.query(
      `INSERT INTO polica_osiguranja (
        brojpolice, brojzelenekarte, id_osiguranika, kaskopokrivastetu
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (brojpolice)
      DO UPDATE SET
        brojzelenekarte = EXCLUDED.brojzelenekarte,
        id_osiguranika = EXCLUDED.id_osiguranika,
        kaskopokrivastetu = EXCLUDED.kaskopokrivastetu
      `,
      [
        polica.brojpolice,
        polica.brojzelenekarte,
        id_osiguranika,
        polica.kaskopokrivastetu ?? false
      ]
    );

    // 8. OSIGURANJE
    await client.query(
      `INSERT INTO osiguranje (
        id_osiguranje, naziv_osiguranja, adresa_osiguranja, drzava_osiguranja,
        mail_osiguranja, kontaktbroj_osiguranja, id_osiguranika
      ) VALUES (
        DEFAULT, $1, $2, $3, $4, $5, $6
      )
      ON CONFLICT (naziv_osiguranja)
      DO UPDATE SET
        adresa_osiguranja = EXCLUDED.adresa_osiguranja,
        drzava_osiguranja = EXCLUDED.drzava_osiguranja,
        mail_osiguranja = EXCLUDED.mail_osiguranja,
        kontaktbroj_osiguranja = EXCLUDED.kontaktbroj_osiguranja,
        id_osiguranika = EXCLUDED.id_osiguranika
      `,
      [
        osiguranje.naziv_osiguranja,
        osiguranje.adresa_osiguranja,
        osiguranje.drzava_osiguranja,
        osiguranje.mail_osiguranja,
        osiguranje.kontaktbroj_osiguranja,
        id_osiguranika
      ]
    );

    // 9. SLIKE (ako ih ima)
    if (slike && Array.isArray(slike)) {
      for (const slika of slike) {
        const buffer = Buffer.from(slika.buffer, 'base64');
        await client.query(
          `INSERT INTO slika (naziv_slike, podatak_slike, vrijeme_slikanja, id_nesrece)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [slika.name, buffer, slika.vrijeme_slikanja, id_nesrece]
        );
      }
    }

    // 10. POTPIS (ako postoji)
    await client.query(
      `UPDATE nesreca SET potpis_a = $1, potpis_b = $2 WHERE id_nesrece = $3`,
      [
        potpis?.potpis_a ? Buffer.from(potpis.potpis_a, 'base64') : null,
        potpis?.potpis_b ? Buffer.from(potpis.potpis_b, 'base64') : null,
        id_nesrece
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, nesrecaId: id_nesrece });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
