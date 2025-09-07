const db = require('../db');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

exports.createPrijava = async (req, res) => {
  const { nesreca, svjedoci, vozacPolica, opis, vozilo, osiguranje, polica, potpis } = req.body;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. NESRECA
    const nesrecaRes = await client.query(
      `INSERT INTO nesreca (datum_nesrece, vrijeme_nesrece, mjesto_nesrece, geolokacija_nesrece, ozlijedeneososbe, stetanavozilima, stetanastvarima)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_nesrece`,
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

    // 2. SVJEDOCI
    let svjedociList = [];
    if (svjedoci?.lista?.length) {
      for (const s of svjedoci.lista) {
        await client.query(
          `INSERT INTO svjedok (ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok, id_nesrece)
           VALUES ($1, $2, $3, $4)`,
          [s.ime, s.adresa, s.kontakt, id_nesrece]
        );
        svjedociList.push(s);
      }
    }

    // 3. VOZILO
    await client.query(
      `INSERT INTO vozilo (registarskaoznaka_vozila, marka_vozila, tip_vozila, drzavaregistracije_vozila, brojsasije_vozila, kilometraza_vozila, "godinaProizvodnje_vozilo")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        vozilo.registarskaoznaka_vozila,
        vozilo.marka_vozila,
        vozilo.tip_vozila,
        vozilo.drzavaregistracije_vozila,
        vozilo.brojsasije_vozila,
        vozilo.kilometraza_vozila,
        vozilo.godinaProizvodnje_vozilo
      ]
    );

    // 4. OSIGURANIK POLICE
    const osiguranikRes = await client.query(
      `INSERT INTO osiguranik_police (ime_osiguranika, prezime_osiguranika, adresa_osiguranika, postanskibroj_osiguranika, drzava_osiguranika, mail_osiguranika, kontaktbroj_osiguranika)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_osiguranika`,
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

    // 5. POLICA
    await client.query(
      `INSERT INTO polica_osiguranja (brojpolice, nazivdrustva, brojzelenekarte, id_osiguranika)
        VALUES ($1, $2, $3, $4)`,
      [
        polica.brojpolice,
        polica.nazivdrustva,
        polica.brojzelenekarte,
        id_osiguranika
      ]
    );

    // 6. OSIGURANJE
    await client.query(
      `INSERT INTO osiguranje (naziv_osiguranja, adresa_osiguranja, drzava_osiguranja, mail_osiguranja, kontaktbroj_osiguranja, kaskopokrivastetu, id_osiguranika)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        osiguranje.naziv_osiguranja,
        osiguranje.adresa_osiguranja,
        osiguranje.drzava_osiguranja,
        osiguranje.mail_osiguranja,
        osiguranje.kontaktbroj_osiguranja,
        osiguranje.kaskopokrivastetu ?? false,
        id_osiguranika
      ]
    );

    // 7. OPIS NESREĆE
    let opisNesrece = opis?.opis_okolnost || "";

    // 8. POTPIS (ako imaš tehničko rješenje za potpis - npr. link na sliku)
    let potpisA = potpis?.potpis_a || "Potpis A: nije učitan";
    let potpisB = potpis?.potpis_b || "Potpis B: nije učitan";

    await client.query('COMMIT');

    // ------------------- PDF GENERIRANJE -------------------
    const pdfPath = path.join(__dirname, `../temp/prijava_${Date.now()}.pdf`);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath)); // privremeno snimi PDF

    doc.fontSize(16).text('Europski izvještaj o nesreći', { align: 'center' });
    doc.moveDown();

    // NESREĆA
    doc.fontSize(13).text(`Datum: ${nesreca.datum_nesrece || ''}`);
    doc.text(`Vrijeme: ${nesreca.vrijeme_nesrece || ''}`);
    doc.text(`Mjesto nesreće: ${nesreca.mjesto_nesrece || ''}`);
    doc.text(`Geolokacija: ${nesreca.geolokacija_nesrece || ''}`);
    doc.text(`Šteta na vozilima: ${nesreca.stetanavozilima ? 'DA' : 'NE'}`);
    doc.text(`Šteta na stvarima: ${nesreca.stetanastvarima ? 'DA' : 'NE'}`);
    doc.text(`Ozlijedene osobe: ${nesreca.ozlijedeneososbe ? 'DA' : 'NE'}`);
    doc.moveDown();

    // SVJEDOCI
    doc.text('Svjedoci:');
    if (svjedociList.length > 0) {
      svjedociList.forEach((s, i) => {
        doc.text(`  ${i + 1}. ${s.ime || ''} - ${s.adresa || ''} (${s.kontakt || ''})`);
      });
    } else {
      doc.text('  Nema svjedoka.');
    }
    doc.moveDown();

    // VOZILO
    doc.text('Vozilo:');
    doc.text(`  Marka: ${vozilo.marka_vozila || ''}`);
    doc.text(`  Tip: ${vozilo.tip_vozila || ''}`);
    doc.text(`  Reg.oznaka: ${vozilo.registarskaoznaka_vozila || ''}`);
    doc.text(`  Broj šasije: ${vozilo.brojsasije_vozila || ''}`);
    doc.text(`  Godina: ${vozilo.godinaProizvodnje_vozilo || ''}`);
    doc.moveDown();

    // OSIGURANIK
    doc.text('Osiguranik:');
    doc.text(`  Ime: ${vozacPolica.ime_osiguranika || ''}`);
    doc.text(`  Prezime: ${vozacPolica.prezime_osiguranika || ''}`);
    doc.text(`  Adresa: ${vozacPolica.adresa_osiguranika || ''}`);
    doc.text(`  Mail: ${vozacPolica.mail_osiguranika || ''}`);
    doc.text(`  Telefon: ${vozacPolica.kontaktbroj_osiguranika || ''}`);
    doc.moveDown();

    // POLICA
    doc.text('Polica osiguranja:');
    doc.text(`  Broj police: ${polica.brojpolice || ''}`);
    doc.text(`  Društvo: ${polica.nazivdrustva || ''}`);
    doc.text(`  Broj zelene karte: ${polica.brojzelenekarte || ''}`);
    doc.moveDown();

    // OSIGURAVAJUĆE DRUŠTVO
    doc.text('Osiguravajuće društvo:');
    doc.text(`  Naziv: ${osiguranje.naziv_osiguranja || ''}`);
    doc.text(`  Adresa: ${osiguranje.adresa_osiguranja || ''}`);
    doc.text(`  Mail: ${osiguranje.mail_osiguranja || ''}`);
    doc.text(`  Telefon: ${osiguranje.kontaktbroj_osiguranja || ''}`);
    doc.moveDown();

    // OPIS NESREĆE
    doc.fontSize(13).text('Opis okolnosti/nesreće:');
    doc.fontSize(10).text(`${opisNesrece}`);
    doc.moveDown();

    // POTPISI
    doc.text('Potpisi:');
    doc.text(`  Potpis A: ${potpisA}`);
    doc.text(`  Potpis B: ${potpisB}`);
    doc.end();

    await new Promise(resolve => doc.on('finish', resolve));

    // SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
      }
    });
    const mailOsiguranika = vozacPolica.mail_osiguranika;
    const mailOsiguravatelja = osiguranje.mail_osiguranja;
    await transporter.sendMail({
      from: process.env.NODEMAILER_USER,
      to: [mailOsiguranika, mailOsiguravatelja].filter(Boolean),
      subject: 'PDF potvrda prometne nesreće',
      text: 'U privitku je PDF dokument vaše prijave prometne nesreće.',
      attachments: [
        {
          filename: 'potvrda_prijave.pdf',
          path: pdfPath,
          contentType: 'application/pdf',
        }
      ]
    });
    fs.unlink(pdfPath, () => {});
    res.json({ success: true, nesrecaId: id_nesrece });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
