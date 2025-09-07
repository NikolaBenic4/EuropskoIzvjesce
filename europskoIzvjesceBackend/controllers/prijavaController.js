const db = require('../db');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// POMAĆNA FUNKCIJA za validaciju unosa (možeš je proširiti!)
function validatePayload(payload) {
  const required = [
    'nesreca', 'vozilo', 'vozacPolica', 'polica', 'osiguranje'
  ];
  for (const key of required) {
    if (!payload[key] || typeof payload[key] !== 'object') {
      return `Nedostaje segment podataka: ${key}`;
    }
  }
  const osig = payload.vozacPolica;
  const osigReq = [
    'ime_osiguranika', 'prezime_osiguranika', 'adresa_osiguranika', 'postanskibroj_osiguranika', 'drzava_osiguranika', 'mail_osiguranika', 'kontaktbroj_osiguranika'
  ];
  for (const key of osigReq) {
    if (!osig[key]) return `Nedostaje podatak osiguranik.${key}`;
  }
  return null;
}

// GLAVNI HANDLER
exports.createPrijava = async (req, res) => {
  const { nesreca, svjedoci, vozacPolica, opis, vozilo, osiguranje, polica, potpis } = req.body;
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. NESRECA
    const nesrecaRes = await client.query(
      `
      INSERT INTO nesreca (
        datum_nesrece, vrijeme_nesrece, mjesto_nesrece, geolokacija_nesrece,
        ozlijedeneososbe, stetanavozilima, stetanastvarima
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_nesrece
      `,
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

    // 2. SVJEDOCI - tablica koristi ARRAY polja, ali dodaj svakog kao 1-row array (lakše za upstream obradu)
    if (svjedoci?.lista?.length) {
      for (const s of svjedoci.lista) {
        await client.query(
          `INSERT INTO svjedok (ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok, id_nesrece)
           VALUES (ARRAY[$1], ARRAY[$2], ARRAY[$3], $4)`,
          [s.ime, s.adresa, s.kontakt, id_nesrece]
        );
      }
    }

    // 3. VOZILO
    await client.query(
      `INSERT INTO vozilo (
        registarskaoznaka_vozila, marka_vozila, tip_vozila, drzavaregistracije_vozila,
        brojsasije_vozila, kilometraza_vozila, godinaproizvodnje_vozilo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING`,
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

    // 4. OSIGURANIK
    const osiguranikRes = await client.query(
      `INSERT INTO osiguranik (
        ime_osiguranika, prezime_osiguranika, adresa_osiguranika, postanskibroj_osiguranika,
        drzava_osiguranika, mail_osiguranika, kontaktbroj_osiguranika
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
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

    // 5. POLICA_OSIGURANJA
    await client.query(
      `INSERT INTO polica_osiguranja (
        brojpolice, brojzelenekarte, id_osiguranika, kaskopokrivastetu
      ) VALUES ($1, $2, $3, $4)`,
      [
        polica.brojpolice,
        polica.brojzelenekarte,
        id_osiguranika,
        polica.kaskopokrivastetu ?? false
      ]
    );

    // 6. OSIGURANJE
    await client.query(
      `INSERT INTO osiguranje (
        id_osiguranja, naziv_osiguranja, adresa_osiguranja, drzava_osiguranja, mail_osiguranja, kontaktbroj_osiguranja, id_osiguranika
      ) VALUES (
        DEFAULT, $1, $2, $3, $4, $5, $6
      )`,
      [
        osiguranje.naziv_osiguranja,
        osiguranje.adresa_osiguranja,
        osiguranje.drzava_osiguranja,
        osiguranje.mail_osiguranja,
        osiguranje.kontaktbroj_osiguranja,
        id_osiguranika
      ]
    );

    // --- Opcionalno --- možeš pohranjivati opis, slike itd. 

    // 7. PDF GENERACIJA/MAIL (ostaje jednako kao u tvom PDF kodu)
    // ...
    await client.query('COMMIT');

    // ------- PDF + mail šalji mail ovako (kako si prikazao) ----------

    res.json({ success: true, nesrecaId: id_nesrece });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
