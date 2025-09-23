// controllers/prijavaController.js - KOMPLETNO RIJEŠENJE

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

// Mapiranje string ID-a osiguranja u integer
function mapOsiguranjeToId(osiguranjeId) {
  const mapping = {
    'o1': 1, 'o2': 2, 'o3': 3, 'o4': 4, 'o5': 5, 'o6': 6, 'o7': 7,
  };
  
  if (typeof osiguranjeId === 'number') return osiguranjeId;
  const parsed = parseInt(osiguranjeId);
  if (!isNaN(parsed)) return parsed;
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

// controllers/prijavaController.js - ISPRAVKA ZA SVJEDOKE I CHECKBOXOVE

// ... (početak koda ostaje isti do exports.createPrijava funkcije)

exports.createPrijava = async function (req, res) {
  const {
    nesreca, svjedoci, vozacOsiguranik, opis, vozilo,
    polica, osiguranje, potpis, slike, tip_sudionika
  } = req.body;

  console.log('📥 === POČETAK TRANSACTION ===');
  console.log('📥 Received svjedoci data:', JSON.stringify(svjedoci, null, 2));

  const err = validatePayload(req.body);
  if (err) {
    console.log('❌ Validation error:', err);
    return res.status(400).json({ error: err });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // 1) INSERT nesreca - ISPRAVKA za boolean polja
    console.log('🔄 Inserting nesreca...');
    let geo = null;
    if (nesreca.geolokacija_nesrece) {
      const g = nesreca.geolokacija_nesrece;
      geo = typeof g === "object" && typeof g.x === "number"
        ? `(${g.x},${g.y})`
        : g;
    }
    
    // KLJUČNA ISPRAVA - uzmi boolean vrijednosti iz svjedoci objekta
    const ozlijedene = svjedoci?.ozlijedeneosobe ?? nesreca?.ozlijedeneosobe ?? false;
    const stetaVozila = svjedoci?.stetanavozilima ?? nesreca?.stetanavozilima ?? false;
    const stetaStvarima = svjedoci?.stetanastvarima ?? nesreca?.stetanastvarima ?? false;
    
    console.log('📋 Boolean values:', { ozlijedene, stetaVozila, stetaStvarima });
    
    const nesrecaRes = await client.query(
      `INSERT INTO nesreca (
         id_nesrece, datum_nesrece, vrijeme_nesrece, mjesto_nesrece, geolokacija_nesrece,
         ozlijedeneososbe, stetanavozilima, stetanastvarima
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id_nesrece) DO UPDATE SET
         datum_nesrece = EXCLUDED.datum_nesrece,
         vrijeme_nesrece = EXCLUDED.vrijeme_nesrece,
         mjesto_nesrece = EXCLUDED.mjesto_nesrece,
         ozlijedeneososbe = EXCLUDED.ozlijedeneososbe,
         stetanavozilima = EXCLUDED.stetanavozilima,
         stetanastvarima = EXCLUDED.stetanastvarima
       RETURNING id_nesrece`,
      [
        nesreca.id_nesrece, 
        nesreca.datum_nesrece, 
        nesreca.vrijeme_nesrece,
        nesreca.mjesto_nesrece, 
        geo,
        ozlijedene,  // boolean
        stetaVozila, // boolean
        stetaStvarima // boolean
      ]
    );
    console.log('✅ nesreca inserted/updated:', nesrecaRes.rows[0]);

    // 2) INSERT okolnost
    console.log('🔄 Inserting okolnost...');
    const okolnostRes = await client.query(
      `INSERT INTO okolnost (tip_okolnost, opis_okolnost, id_nesrece)
       VALUES ($1,$2,$3)
       ON CONFLICT (id_nesrece)
       DO UPDATE SET opis_okolnost = EXCLUDED.opis_okolnost
       RETURNING id_okolnost`,
      ["glavna", opis.opis_nesrece || "", nesreca.id_nesrece]
    );
    console.log('✅ okolnost inserted/updated:', okolnostRes.rows[0]);

    // 3) INSERT svjedoci - ISPRAVKA za novi format
    console.log('🔄 Inserting svjedoci...');
    if (svjedoci?.lista && Array.isArray(svjedoci.lista) && svjedoci.lista.length > 0) {
      console.log('📋 Broj svjedoka:', svjedoci.lista.length);
      
      for (let i = 0; i < svjedoci.lista.length; i++) {
        const s = svjedoci.lista[i];
        console.log(`📋 Inserting svjedok ${i + 1}:`, s);
        
        const svjedokRes = await client.query(
          `INSERT INTO svjedok (ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok, id_nesrece)
           VALUES (ARRAY[$1], ARRAY[$2], ARRAY[$3], $4)
           ON CONFLICT DO NOTHING
           RETURNING id_svjedok`,
          [s.ime || "", s.adresa || "", s.kontakt || "", nesreca.id_nesrece]
        );
        console.log(`✅ svjedok ${i + 1} inserted:`, svjedokRes.rows[0]);
      }
    } else if (svjedoci?.ime_prezime_svjedok && Array.isArray(svjedoci.ime_prezime_svjedok)) {
      // Legacy format support
      console.log('📋 Using legacy svjedoci format');
      const imena = svjedoci.ime_prezime_svjedok;
      const adrese = svjedoci.adresa_svjedok || [];
      const kontakti = svjedoci.kontakt_svjedok || [];
      
      for (let i = 0; i < imena.length; i++) {
        if (imena[i]) {
          await client.query(
            `INSERT INTO svjedok (ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok, id_nesrece)
             VALUES (ARRAY[$1], ARRAY[$2], ARRAY[$3], $4)
             ON CONFLICT DO NOTHING`,
            [imena[i], adrese[i] || "", kontakti[i] || "", nesreca.id_nesrece]
          );
        }
      }
    } else {
      console.log('📋 No svjedoci to insert');
    }

    // 4-11) Ostali INSERT-ovi ostaju isti...
    
    // 4) INSERT vozilo
    console.log('🔄 Inserting vozilo...');
    const voziloRes = await client.query(
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
         godinaproizvodnje_vozilo = EXCLUDED.godinaproizvodnje_vozilo
       RETURNING registarskaoznaka_vozila`,
      [
        vozilo.registarskaoznaka_vozila, vozilo.marka_vozila, vozilo.tip_vozila,
        vozilo.drzavaregistracije_vozila, vozilo.brojsasije_vozila,
        vozilo.kilometraza_vozila, vozilo.godinaproizvodnje_vozilo
      ]
    );
    console.log('✅ vozilo inserted/updated:', voziloRes.rows[0]);

    // 5) INSERT osiguranje PRVO
    console.log('🔄 Inserting osiguranje...');
    const osiguranjeIdInteger = mapOsiguranjeToId(osiguranje.id_osiguranje);
    if (osiguranjeIdInteger === null) {
      throw new Error(`Nepoznat ID osiguranja: ${osiguranje.id_osiguranje}`);
    }

    const osiguranjeRes = await client.query(
      `INSERT INTO osiguranje (
         id_osiguranje, naziv_osiguranja, adresa_osiguranja, 
         drzava_osiguranja, mail_osiguranja, kontaktbroj_osiguranja, id_osiguranika
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id_osiguranje) DO UPDATE SET
         naziv_osiguranja = EXCLUDED.naziv_osiguranja,
         adresa_osiguranja = EXCLUDED.adresa_osiguranja,
         drzava_osiguranja = EXCLUDED.drzava_osiguranja,
         mail_osiguranja = EXCLUDED.mail_osiguranja,
         kontaktbroj_osiguranja = EXCLUDED.kontaktbroj_osiguranja
       RETURNING id_osiguranje`,
      [
        osiguranjeIdInteger,
        osiguranje.naziv_osiguranja,
        osiguranje.adresa_osiguranja,
        osiguranje.drzava_osiguranja,
        osiguranje.mail_osiguranja,
        osiguranje.kontaktbroj_osiguranja,
        null
      ]
    );
    console.log('✅ osiguranje inserted/updated:', osiguranjeRes.rows[0]);

    // 6) INSERT osiguranik
    console.log('🔄 Inserting osiguranik...');
    let ibanDb = vozacOsiguranik.iban_osiguranika;
    if (typeof ibanDb === "string") {
      ibanDb = [cleanIban(ibanDb)];
    }
    
    const osiguranikData = vozacOsiguranik.osiguranik || {
      ime_osiguranika: vozacOsiguranik.ime_osiguranika,
      prezime_osiguranika: vozacOsiguranik.prezime_osiguranika,
      adresa_osiguranika: vozacOsiguranik.adresa_osiguranika,
      postanskibroj_osiguranika: vozacOsiguranik.postanskibroj_osiguranika,
      drzava_osiguranika: vozacOsiguranik.drzava_osiguranika,
      kontaktbroj_osiguranika: vozacOsiguranik.kontaktbroj_osiguranika,
      mail_osiguranika: vozacOsiguranik.mail_osiguranika
    };

    console.log('📝 osiguranikData extracted:', osiguranikData);

    const osiguranikRes = await client.query(
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
        osiguranikData.ime_osiguranika, osiguranikData.prezime_osiguranika,
        osiguranikData.adresa_osiguranika, osiguranikData.postanskibroj_osiguranika,
        osiguranikData.drzava_osiguranika, osiguranikData.mail_osiguranika,
        osiguranikData.kontaktbroj_osiguranika, ibanDb
      ]
    );
    const id_osiguranika = osiguranikRes.rows[0].id_osiguranika;
    console.log('✅ osiguranik inserted/updated with ID:', id_osiguranika);

    // Ažuriraj osiguranje s id_osiguranika
    await client.query(
      `UPDATE osiguranje SET id_osiguranika = $1 WHERE id_osiguranje = $2`,
      [id_osiguranika, osiguranjeIdInteger]
    );

    // 7) INSERT vozac
    console.log('🔄 Inserting vozac...');
    const vozacObj = vozacOsiguranik.vozac || {};
    const jeIsti = vozacOsiguranik.isti || false;
    
    let vozacData;
    if (jeIsti) {
      vozacData = {
        ime_vozaca: osiguranikData.ime_osiguranika,
        prezime_vozaca: osiguranikData.prezime_osiguranika,
        adresa_vozaca: osiguranikData.adresa_osiguranika,
        postanskibroj_vozaca: osiguranikData.postanskibroj_osiguranika,
        drzava_vozaca: osiguranikData.drzava_osiguranika,
        kontaktbroj_vozaca: osiguranikData.kontaktbroj_osiguranika,
        mail_vozaca: osiguranikData.mail_osiguranika,
        brojvozackedozvole: vozacObj.brojvozackedozvole || vozacOsiguranik.brojvozackedozvole,
        kategorijavozackedozvole: vozacObj.kategorijavozackedozvole || vozacOsiguranik.kategorijavozackedozvole,
        valjanostvozackedozvole: vozacObj.valjanostvozackedozvole || vozacOsiguranik.valjanostvozackedozvole
      };
    } else {
      vozacData = {
        ime_vozaca: vozacObj.ime_vozaca,
        prezime_vozaca: vozacObj.prezime_vozaca,
        adresa_vozaca: vozacObj.adresa_vozaca,
        postanskibroj_vozaca: vozacObj.postanskibroj_vozaca,
        drzava_vozaca: vozacObj.drzava_vozaca,
        kontaktbroj_vozaca: vozacObj.kontaktbroj_vozaca,
        mail_vozaca: vozacObj.mail_vozaca,
        brojvozackedozvole: vozacObj.brojvozackedozvole,
        kategorijavozackedozvole: vozacObj.kategorijavozackedozvole,
        valjanostvozackedozvole: vozacObj.valjanostvozackedozvole
      };
    }

    console.log('📝 vozacData extracted:', vozacData);

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
        vozacData.ime_vozaca, vozacData.prezime_vozaca,
        vozacData.adresa_vozaca, vozacData.postanskibroj_vozaca,
        vozacData.drzava_vozaca, vozacData.kontaktbroj_vozaca,
        vozacData.mail_vozaca, vozacData.brojvozackedozvole,
        vozacData.kategorijavozackedozvole, vozacData.valjanostvozackedozvole
      ]
    );
    const id_vozaca = vozacRes.rows[0].id_vozaca;
    console.log('✅ vozac inserted/updated with ID:', id_vozaca);

    // 8) INSERT polica_osiguranja 
    console.log('🔄 Inserting polica_osiguranja...');
    const policaRes = await client.query(
      `INSERT INTO polica_osiguranja (
         brojpolice, brojzelenekarte, id_osiguranika, id_osiguranje, kaskopokrivastetu
       ) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (brojpolice) DO UPDATE SET
         brojzelenekarte = EXCLUDED.brojzelenekarte,
         id_osiguranika = EXCLUDED.id_osiguranika,
         id_osiguranje = EXCLUDED.id_osiguranje,
         kaskopokrivastetu = EXCLUDED.kaskopokrivastetu
       RETURNING brojpolice`,
      [
        polica.brojpolice, polica.brojzelenekarte,
        id_osiguranika, osiguranjeIdInteger,
        polica.kaskopokrivastetu ?? false
      ]
    );
    console.log('✅ polica_osiguranja inserted/updated:', policaRes.rows[0]);

    // 9) INSERT slike
    if (Array.isArray(slike) && slike.length > 0) {
      console.log('🔄 Inserting slike:', slike.length);
      for (const s of slike) {
        if (!s.buffer) continue;
        const buff = Buffer.from(s.buffer, "base64");
        await client.query(
          `INSERT INTO slika (naziv_slike, podatak_slike, vrijeme_slikanja, id_nesrece)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [s.naziv_slike, buff, s.vrijeme_slikanja || new Date(), nesreca.id_nesrece]
        );
      }
      console.log('✅ slike inserted');
    }

    // 10) INSERT sudionik i potpis
    console.log('🔄 Inserting sudionik...');
    const currentTip = tip_sudionika || "A";
    let potpisBuffer = null;
    let datumPotpisa = null;
    
    if (potpis) {
      if (potpis.potpis) {
        potpisBuffer = Buffer.from(potpis.potpis, "base64");
        datumPotpisa = potpis.datum_potpisa || new Date().toISOString();
      } else if (currentTip === "A" && potpis.potpis_a) {
        potpisBuffer = Buffer.from(potpis.potpis_a, "base64");
        datumPotpisa = potpis.datum_potpisa || new Date().toISOString();
      } else if (currentTip === "B" && potpis.potpis_b) {
        potpisBuffer = Buffer.from(potpis.potpis_b, "base64");
        datumPotpisa = potpis.datum_potpisa || new Date().toISOString();
      }
    }

    const sudionikRes = await client.query(
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
         id_osiguranje = EXCLUDED.id_osiguranje
      RETURNING tip_sudionika`,
      [
          currentTip, potpisBuffer, datumPotpisa, nesreca.id_nesrece,
          vozilo.registarskaoznaka_vozila, id_vozaca, osiguranjeIdInteger
      ]
    );
    console.log('✅ sudionik inserted/updated:', sudionikRes.rows[0]);

    // 11) UPDATE nesreca s potpisima
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
      console.log(`✅ potpis updated for sudionik ${currentTip}`);
    }

    await client.query("COMMIT");
    console.log('🎉 === COMMIT SUCCESSFUL ===');

    // Verifikacija
    console.log('🔍 === VERIFIKACIJA ===');
    const verifyNesreca = await client.query(
      'SELECT ozlijedeneososbe, stetanavozilima, stetanastvarima FROM nesreca WHERE id_nesrece = $1',
      [nesreca.id_nesrece]
    );
    console.log('✅ Verify nesreca boolean fields:', verifyNesreca.rows[0]);

    const verifySvjedoci = await client.query(
      'SELECT * FROM svjedok WHERE id_nesrece = $1',
      [nesreca.id_nesrece]
    );
    console.log('✅ Verify svjedoci count:', verifySvjedoci.rows.length);
    
    return res.json({ 
      success: true, 
      nesrecaId: nesreca.id_nesrece,
      tip_sudionika: currentTip,
      potpis_spreman: !!potpisBuffer,
      osiguranje_id_mapped: osiguranjeIdInteger,
      id_osiguranika,
      id_vozaca,
      boolean_fields: verifyNesreca.rows[0],
      svjedoci_count: verifySvjedoci.rows.length,
      message: "Svi podaci uspješno spremljeni u bazu"
    });

  } catch (e) {
    await client.query("ROLLBACK");
    console.error('❌ === ROLLBACK ZBOG GREŠKE ===');
    console.error('❌ Database error:', e);
    return res.status(500).json({ error: e.message || "Greška na serveru" });
  } finally {
    client.release();
  }
};