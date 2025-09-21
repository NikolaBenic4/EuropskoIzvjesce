// controllers/prijavaController.js

const db = require("../db");

const API_KEY = process.env.API_KEY || "tajnikljucApi";

// Pomoćna funkcija za čišćenje IBAN-a
function cleanIban(str) {
  if (!str) return "";
  return str
    .replace(/[\s\-\.]/g, "")
    .replace(/[OIlZBSGTQD]/gi, c =>
      ({ O:"0", I:"1", l:"1", Z:"2", B:"8", S:"5", G:"6", T:"7", D:"0", Q:"0" }[c] || c)
    )
    .toUpperCase();
}

// Middleware za API ključ
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Neautorizirano - Nema ili je pogrešan API ključ." });
  }
  next();
}

// Validacija IBAN-a
function isValidIban(iban) {
  if (!iban) return false;
  const norm = Array.isArray(iban) ? iban[0] : iban;
  if (typeof norm !== "string") return false;
  const cleaned = norm.replace(/\s+/g, "").toUpperCase();
  return /^HR\d{19}$/.test(cleaned);
}

// NOVA FUNKCIJA - mapiranje string ID-a osiguranja u integer
function mapOsiguranjeToId(osiguranjeId) {
  const mapping = {
    'o1': 1, 'o2': 2, 'o3': 3, 'o4': 4, 'o5': 5, 'o6': 6, 'o7': 7,
    // Dodajte više mappinga ako je potrebno
  };
  
  // Ako je već broj, vrati ga
  if (typeof osiguranjeId === 'number') {
    return osiguranjeId;
  }
  
  // Ako je string broj, konvertiraj u broj
  const parsed = parseInt(osiguranjeId);
  if (!isNaN(parsed)) {
    return parsed;
  }
  
  // Koristi mapping za string ID-jeve
  return mapping[osiguranjeId] || null;
}

// Validacija payloada
function validatePayload(p) {
  const need = ["nesreca","vozilo","vozacOsiguranik","polica","osiguranje","opis"];
  for (const seg of need) {
    if (!p[seg] || typeof p[seg] !== "object") {
      return `Nedostaje segment podataka: ${seg}`;
    }
  }
  if (!isValidIban(p.vozacOsiguranik.iban_osiguranika)) {
    return "Neispravan IBAN!";
  }
  if (!p.nesreca.id_nesrece) {
    return "Nepostavljen id nesreće!";
  }
  if (!p.osiguranje.id_osiguranje) {
    return "Nedostaje id_osiguranje!";
  }
  return null;
}

exports.apiKeyAuth = apiKeyAuth;

exports.createPrijava = async function (req, res) {
  const {
    nesreca, svjedoci, vozacOsiguranik, opis, vozilo,
    polica, osiguranje, potpis, slike, tip_sudionika
  } = req.body;

  console.log('📥 Received vozacOsiguranik data:', JSON.stringify(vozacOsiguranik, null, 2));

  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ error: err });

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Funkcija za generiranje sljedećeg ID-a zahtjeva
async function generateNextRequestId(client) {
  try {
    // Ažuriraj i dohvati sljedeći broj atomski
    const result = await client.query(`
      UPDATE zahtjev_brojac 
      SET trenutni_broj = trenutni_broj + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE naziv = 'zahtjev'
      RETURNING trenutni_broj
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Greška pri generiranju ID-a zahtjeva');
    }
    
    const broj = result.rows[0].trenutni_broj;
    return `Zahtjev#${broj.toString().padStart(6, '0')}`; // Zahtjev#001001
    
  } catch (error) {
    console.error('❌ Greška pri generiranju ID zahtjeva:', error);
    throw error;
  }
}


    // 1) INSERT nesreca
    let geo = null;
    if (nesreca.geolokacija_nesrece) {
      const g = nesreca.geolokacija_nesrece;
      geo = typeof g === "object" && typeof g.x === "number"
        ? `(${g.x},${g.y})`
        : g;
    }
    await client.query(
      `INSERT INTO nesreca (
         id_nesrece, datum_nesrece, vrijeme_nesrece, mjesto_nesrece, geolokacija_nesrece,
         ozlijedeneososbe, stetanavozilima, stetanastvarima
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id_nesrece) DO NOTHING`,
      [
        nesreca.id_nesrece, nesreca.datum_nesrece, nesreca.vrijeme_nesrece,
        nesreca.mjesto_nesrece, geo,
        nesreca.ozlijedeneososbe ?? false,
        nesreca.stetanavozilima ?? false,
        nesreca.stetanastvarima ?? false
      ]
    );

    // 2) INSERT okolnost
    await client.query(
      `INSERT INTO okolnost (tip_okolnost, opis_okolnost, id_nesrece)
       VALUES ($1,$2,$3)
       ON CONFLICT (id_nesrece)
       DO UPDATE SET opis_okolnost = EXCLUDED.opis_okolnost`,
      ["glavna", opis.opis_nesrece || "", nesreca.id_nesrece]
    );

    // 3) INSERT svjedoci
    if (Array.isArray(svjedoci?.lista)) {
      for (const s of svjedoci.lista) {
        await client.query(
          `INSERT INTO svjedok (ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok, id_nesrece)
           VALUES (ARRAY[$1], ARRAY[$2], ARRAY[$3], $4)
           ON CONFLICT DO NOTHING`,
          [s.ime||"", s.adresa||"", s.kontakt||"", nesreca.id_nesrece]
        );
      }
    }

    // 4) INSERT vozilo
    await client.query(
      `INSERT INTO vozilo (
         registarskaoznaka_vozila, marka_vozila, tip_vozila, drzavaregistracije_vozila,
         brojsasije_vozila, kilometraza_vozila, godinaproizvodnje_vozilo
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (registarskaoznaka_vozila) DO UPDATE SET
         marka_vozila = EXCLUDED.marka_vozila,
         tip_vozila = EXCLUDED.tip_vozila,
         drzavaregistracije_vozila = EXCLUDED.drzavaregistracije_vozila,
         brojsasije_vozila = EXCLUDED.brojsasije_vozila,
         kilometraza_vozila = EXCLUDED.kilometraza_vozila,
         godinaproizvodnje_vozilo = EXCLUDED.godinaproizvodnje_vozilo`,
      [
        vozilo.registarskaoznaka_vozila, vozilo.marka_vozila, vozilo.tip_vozila,
        vozilo.drzavaregistracije_vozila, vozilo.brojsasije_vozila,
        vozilo.kilometraza_vozila, vozilo.godinaproizvodnje_vozilo
      ]
    );

    // KLJUČNA ISPRAVA - prvo moramo dodati osiguranje u tablicu osiguranje
    await client.query(
      `INSERT INTO osiguranje (
         id_osiguranje, naziv_osiguranja, adresa_osiguranja, 
         drzava_osiguranja, mail_osiguranja, kontaktbroj_osiguranja, id_osiguranika
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id_osiguranje) DO UPDATE SET
         naziv_osiguranja = EXCLUDED.naziv_osiguranja,
         adresa_osiguranja = EXCLUDED.adresa_osiguranja,
         drzava_osiguranja = EXCLUDED.drzava_osiguranja,
         mail_osiguranja = EXCLUDED.mail_osiguranja,
         kontaktbroj_osiguranja = EXCLUDED.kontaktbroj_osiguranja`,
      [
        osiguranje.id_osiguranje, // String (npr. 'o7')
        osiguranje.naziv_osiguranja,
        osiguranje.adresa_osiguranja,
        osiguranje.drzava_osiguranja,
        osiguranje.mail_osiguranja,
        osiguranje.kontaktbroj_osiguranja,
        null // id_osiguranika se postavlja kasnije
      ]
    );

    // 5) INSERT osiguranik
    let ibanDb = vozacOsiguranik.iban_osiguranika;
    if (typeof ibanDb === "string") {
      ibanDb = [cleanIban(ibanDb)];
    }
    
    // ISPRAVA - dohvati podatke osiguranika iz pravilnog objekta
    const osiguranik = vozacOsiguranik.osiguranik || {
      ime_osiguranika: vozacOsiguranik.ime_osiguranika,
      prezime_osiguranika: vozacOsiguranik.prezime_osiguranika,
      adresa_osiguranika: vozacOsiguranik.adresa_osiguranika,
      postanskibroj_osiguranika: vozacOsiguranik.postanskibroj_osiguranika,
      drzava_osiguranika: vozacOsiguranik.drzava_osiguranika,
      kontaktbroj_osiguranika: vozacOsiguranik.kontaktbroj_osiguranika,
      mail_osiguranika: vozacOsiguranik.mail_osiguranika
    };

    console.log('📝 Inserting osiguranik:', osiguranik);

    const osRes = await client.query(
      `INSERT INTO osiguranik (
         ime_osiguranika, prezime_osiguranika, adresa_osiguranika,
         postanskibroj_osiguranika, drzava_osiguranika,
         mail_osiguranika, kontaktbroj_osiguranika, iban_osiguranika
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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
        osiguranik.ime_osiguranika, osiguranik.prezime_osiguranika,
        osiguranik.adresa_osiguranika, osiguranik.postanskibroj_osiguranika,
        osiguranik.drzava_osiguranika, osiguranik.mail_osiguranika,
        osiguranik.kontaktbroj_osiguranika, ibanDb
      ]
    );
    const id_osiguranika = osRes.rows[0].id_osiguranika;

    // Ažuriraj osiguranje s id_osiguranika
    await client.query(
      `UPDATE osiguranje SET id_osiguranika = $1 WHERE id_osiguranje = $2`,
      [id_osiguranika, osiguranje.id_osiguranje]
    );

    // 6) INSERT vozac - ISPRAVKA ZA PODATKE VOZAČKE DOZVOLE
    const vozac = vozacOsiguranik.vozac || {};
    const jeIsti = vozacOsiguranik.isti || false;
    
    let vozacPodaci;
    if (jeIsti) {
      // KLJUČNA ISPRAVA - kopiraj podatke iz osiguranika u vozača, ALI ZADRŽI VOZAČKU DOZVOLU
      vozacPodaci = {
        ime_vozaca: osiguranik.ime_osiguranika,
        prezime_vozaca: osiguranik.prezime_osiguranika,
        adresa_vozaca: osiguranik.adresa_osiguranika,
        postanskibroj_vozaca: osiguranik.postanskibroj_osiguranika,
        drzava_vozaca: osiguranik.drzava_osiguranika,
        kontaktbroj_vozaca: osiguranik.kontaktbroj_osiguranika,
        mail_vozaca: osiguranik.mail_osiguranika,
        // Podaci vozačke dozvole iz frontend-a
        brojvozackedozvole: vozac.brojvozackedozvole || vozacOsiguranik.brojvozackedozvole,
        kategorijavozackedozvole: vozac.kategorijavozackedozvole || vozacOsiguranik.kategorijavozackedozvole,
        valjanostvozackedozvole: vozac.valjanostvozackedozvole || vozacOsiguranik.valjanostvozackedozvole
      };
    } else {
      // Vozač nije isti kao osiguranik - koristi podatke vozača
      vozacPodaci = {
        ime_vozaca: vozac.ime_vozaca,
        prezime_vozaca: vozac.prezime_vozaca,
        adresa_vozaca: vozac.adresa_vozaca,
        postanskibroj_vozaca: vozac.postanskibroj_vozaca,
        drzava_vozaca: vozac.drzava_vozaca,
        kontaktbroj_vozaca: vozac.kontaktbroj_vozaca,
        mail_vozaca: vozac.mail_vozaca,
        brojvozackedozvole: vozac.brojvozackedozvole,
        kategorijavozackedozvole: vozac.kategorijavozackedozvole,
        valjanostvozackedozvole: vozac.valjanostvozackedozvole
      };
    }

    console.log('📝 Inserting vozac:', vozacPodaci);

    const vozacRes = await client.query(
      `INSERT INTO vozac (
         ime_vozaca, prezime_vozaca, adresa_vozaca, postanskibroj_vozaca,
         drzava_vozaca, kontaktbroj_vozaca, mail_vozaca,
         brojvozackedozvole, kategorijavozackedozvole, valjanostvozackedozvole
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (mail_vozaca) DO UPDATE SET
         ime_vozaca = EXCLUDED.ime_vozaca,
         prezime_vozaca = EXCLUDED.prezime_vozaca,
         adresa_vozaca = EXCLUDED.adresa_vozaca,
         postanskibroj_vozaca = EXCLUDED.postanskibroj_vozaca,
         drzava_vozaca = EXCLUDED.drzava_vozaca,
         kontaktbroj_vozaca = EXCLUDED.kontaktbroj_vozaca,
         brojvozackedozvole = EXCLUDED.brojvozackedozvole,
         kategorijavozackedozvole = EXCLUDED.kategorijavozackedozvole,
         valjanostvozackedozvole = EXCLUDED.valjanostvozackedozvole
       RETURNING id_vozaca`,
      [
        vozacPodaci.ime_vozaca, vozacPodaci.prezime_vozaca,
        vozacPodaci.adresa_vozaca, vozacPodaci.postanskibroj_vozaca,
        vozacPodaci.drzava_vozaca, vozacPodaci.kontaktbroj_vozaca,
        vozacPodaci.mail_vozaca, vozacPodaci.brojvozackedozvole,
        vozacPodaci.kategorijavozackedozvole, vozacPodaci.valjanostvozackedozvole
      ]
    );
    const id_vozaca = vozacRes.rows[0].id_vozaca;

    // 7) INSERT polica_osiguranja 
    await client.query(
      `INSERT INTO polica_osiguranja (
         brojpolice, brojzelenekarte, id_osiguranika, id_osiguranje, kaskopokrivastetu
       ) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (brojpolice) DO UPDATE SET
         brojzelenekarte = EXCLUDED.brojzelenekarte,
         id_osiguranika = EXCLUDED.id_osiguranika,
         id_osiguranje = EXCLUDED.id_osiguranje,
         kaskopokrivastetu = EXCLUDED.kaskopokrivastetu`,
      [
        polica.brojpolice, polica.brojzelenekarte,
        id_osiguranika, osiguranje.id_osiguranje,  // String vrijednost (npr. 'o7')
        polica.kaskopokrivastetu ?? false
      ]
    );

    // 8) INSERT slike
    if (Array.isArray(slike)) {
      for (const s of slike) {
        if (!s.buffer) continue;
        const buff = Buffer.from(s.buffer, "base64");
        await client.query(
          `INSERT INTO slika (naziv_slike, podatak_slike, vrijeme_slikanja, id_nesrece)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [s.naziv_slike, buff, s.vrijeme_slikanja || new Date(), nesreca.id_nesrece]
        );
      }
    }

    // 9) ISPRAVLJENA LOGIKA ZA POTPISE
    const currentTip = tip_sudionika || "A";
    let potpisBuffer = null;
    let datumPotpisa = null;
    
    // Određuj koji potpis koristiti na temelju frontend podataka
    if (potpis) {
      if (potpis.potpis) {
        // Frontend šalje "potpis" property (iz PotpisForm)
        potpisBuffer = Buffer.from(potpis.potpis, "base64");
        datumPotpisa = potpis.datum_potpisa || new Date().toISOString();
      } else if (currentTip === "A" && potpis.potpis_a) {
        // Legacy - potpis_a
        potpisBuffer = Buffer.from(potpis.potpis_a, "base64");
        datumPotpisa = potpis.datum_potpisa || new Date().toISOString();
      } else if (currentTip === "B" && potpis.potpis_b) {
        // Legacy - potpis_b
        potpisBuffer = Buffer.from(potpis.potpis_b, "base64");
        datumPotpisa = potpis.datum_potpisa || new Date().toISOString();
      }
    }

    // KLJUČNA ISPRAVA - konvertiramo string id_osiguranje u integer za sudionik tablicu
    const osiguranjeIdInteger = mapOsiguranjeToId(osiguranje.id_osiguranje);
    
    if (osiguranjeIdInteger === null) {
      throw new Error(`Nepoznat ID osiguranja: ${osiguranje.id_osiguranje}`);
    }

    console.log(`🔄 Mapiranje ID osiguranja: '${osiguranje.id_osiguranje}' -> ${osiguranjeIdInteger}`);

    // INSERT u sudionik tablicu s integer vrijednošću
    await client.query(
      `INSERT INTO sudionik
          (tip_sudionika, potpis_sudionika, datumpotpisa_sudionika, id_nesrece, 
           registarskaoznaka_vozila, id_vozaca, id_osiguranje)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT ON CONSTRAINT sudionik_nesreca_tip_unique 
      DO UPDATE SET 
         potpis_sudionika = EXCLUDED.potpis_sudionika,
         datumpotpisa_sudionika = EXCLUDED.datumpotpisa_sudionika,
         registarskaoznaka_vozila = EXCLUDED.registarskaoznaka_vozila,
         id_vozaca = EXCLUDED.id_vozaca,
         id_osiguranje = EXCLUDED.id_osiguranje`,
      [
          currentTip,
          potpisBuffer,
          datumPotpisa,
          nesreca.id_nesrece,
          vozilo.registarskaoznaka_vozila,
          id_vozaca,
          osiguranjeIdInteger  // INTEGER za sudionik tablicu
      ]
    );

    // UPDATE nesreca s potpisima (oba tipa)
    if (potpisBuffer) {
      if (currentTip === "A") {
        await client.query(
          `UPDATE nesreca SET potpis_a = $1 WHERE id_nesrece = $2`,
          [potpisBuffer, nesreca.id_nesrece]
        );
      } else if (currentTip === "B") {
        await client.query(
          `UPDATE nesreca SET potpis_b = $1 WHERE id_nesrece = $2`,
          [potpisBuffer, nesreca.id_nesrece]
        );
      }
    }

    await client.query("COMMIT");
    
    console.log(`✅ Uspješno spremljen potpis za sudionika ${currentTip} u nesreći ${nesreca.id_nesrece}`);
    console.log(`✅ Mapiranje ID osiguranja: '${osiguranje.id_osiguranje}' -> ${osiguranjeIdInteger}`);
    console.log(`✅ Osiguranik inserted with ID: ${id_osiguranika}`);
    console.log(`✅ Vozač inserted with ID: ${id_vozaca}`);
    
    return res.json({ 
      success: true, 
      nesrecaId: nesreca.id_nesrece,
      tip_sudionika: currentTip,
      potpis_spreman: !!potpisBuffer,
      osiguranje_id_mapped: osiguranjeIdInteger,
      id_osiguranika,
      id_vozaca
    });

  } catch (e) {
    await client.query("ROLLBACK");
    console.error('❌ Database error:', e);
    return res.status(500).json({ error: e.message || "Greška na serveru" });
  } finally {
    client.release();
  }
};
