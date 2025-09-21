const db = require('../db');
const API_KEY = process.env.API_KEY || 'tajnikljucApi';

// -- Helpers --
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

// --- Glavna funkcija: insert obje prijave, double-mode ---
exports.createPrijavaDupli = async function (req, res) {
  // Očekuješ: req.body = [{prijavaA...}, {prijavaB...}]
  if (!Array.isArray(req.body) || req.body.length < 2) {
    return res.status(400).json({ error: "Očekujem niz sa dvije prijave (A i B)." });
  }

  const [prijavaA, prijavaB] = req.body;

  // Validacija obje prijave
  const errorA = validatePayload(prijavaA);
  if (errorA) return res.status(400).json({ error: `Prva prijava: ${errorA}` });
  const errorB = validatePayload(prijavaB);
  if (errorB) return res.status(400).json({ error: `Druga prijava: ${errorB}` });

  // Obje prijave moraju imati isti id_nesrece!
  if (prijavaA.nesreca.id_nesrece !== prijavaB.nesreca.id_nesrece) {
    return res.status(400).json({ error: "ID nesreće (sessionId) nije isti za oba sudionika!" });
  }
  const id_nesrece = prijavaA.nesreca.id_nesrece;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // -- INSERT (ili NOOP ako već postoji) nesreca (identični podaci A/B) --
    await client.query(
      `INSERT INTO nesreca (
        id_nesrece, datum_nesrece, vrijeme_nesrece, mjesto_nesrece, geolokacija_nesrece,
        ozlijedeneososbe, stetanavozilima, stetanastvarima
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id_nesrece) DO NOTHING`,
      [
        prijavaA.nesreca.id_nesrece,
        prijavaA.nesreca.datum_nesrece,
        prijavaA.nesreca.vrijeme_nesrece,
        prijavaA.nesreca.mjesto_nesrece,
        prijavaA.nesreca.geolokacija_nesrece || null,
        prijavaA.nesreca.ozlijedeneososbe ?? false,
        prijavaA.nesreca.stetanavozilima ?? false,
        prijavaA.nesreca.stetanastvarima ?? false,
      ]
    );

    // Helper za insert "jedne prijave" (vozilo, osiguranik, polica...)
    async function upsertSinglePrijava(prijava) {
      // Okolnost
      await client.query(
        `INSERT INTO okolnost (tip_okolnost, opis_okolnost, id_nesrece)
         VALUES ($1,$2,$3)
         ON CONFLICT (id_nesrece) DO UPDATE SET opis_okolnost = EXCLUDED.opis_okolnost`,
        [
          'glavna', prijava.opis.opis_nesrece || '', prijava.nesreca.id_nesrece
        ]
      );

      // Vozilo
      await client.query(
        `INSERT INTO vozilo (
          registarskaoznaka_vozila, marka_vozila, tip_vozila, drzavaregistracije_vozila,
          brojsasije_vozila, kilometraza_vozila, godinaproizvodnje_vozilo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (registarskaoznaka_vozila) DO UPDATE SET
          marka_vozila = EXCLUDED.marka_vozila,
          tip_vozila = EXCLUDED.tip_vozila,
          drzavaregistracije_vozila = EXCLUDED.drzavaregistracije_vozila,
          brojsasije_vozila = EXCLUDED.brojsasije_vozila,
          kilometraza_vozila = EXCLUDED.kilometraza_vozila,
          godinaproizvodnje_vozilo = EXCLUDED.godinaproizvodnje_vozilo
        `,
        [
          prijava.vozilo.registarskaoznaka_vozila,
          prijava.vozilo.marka_vozila,
          prijava.vozilo.tip_vozila,
          prijava.vozilo.drzavaregistracije_vozila,
          prijava.vozilo.brojsasije_vozila,
          prijava.vozilo.kilometraza_vozila,
          prijava.vozilo.godinaproizvodnje_vozilo,
        ]
      );

      // Osiguranik
      let ibanDb = prijava.vozacOsiguranik.iban_osiguranika;
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
          prijava.vozacOsiguranik.ime_osiguranika,
          prijava.vozacOsiguranik.prezime_osiguranika,
          prijava.vozacOsiguranik.adresa_osiguranika,
          prijava.vozacOsiguranik.postanskibroj_osiguranika,
          prijava.vozacOsiguranik.drzava_osiguranika,
          prijava.vozacOsiguranik.mail_osiguranika,
          prijava.vozacOsiguranik.kontaktbroj_osiguranika,
          ibanDb
        ]
      );
      const id_osiguranika = osiguranikRes.rows[0].id_osiguranika;

      // Polica osiguranja
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
          prijava.polica.brojpolice,
          prijava.polica.brojzelenekarte,
          id_osiguranika,
          prijava.osiguranje.id_osiguranje,
          prijava.polica.kaskopokrivastetu ?? false
        ]
      );
    }

    // Upiši obje prijave kao odvojene "sudionike"
    await upsertSinglePrijava(prijavaA);
    await upsertSinglePrijava(prijavaB);

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
