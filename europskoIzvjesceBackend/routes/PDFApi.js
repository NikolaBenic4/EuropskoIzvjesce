const express = require("express");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Utility helpers
function safe(val, def = "Nije uneseno") {
    if (val === undefined || val === null || val === "") return def;
    if (Array.isArray(val) && val.length === 0) return def;
    return Array.isArray(val) ? val.join(", ") : String(val);
}
function formatDate(dateStr) {
    if (!dateStr) return "Nije uneseno";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Nije uneseno";
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}
function daNeNije(val) {
    if (val === true) return "DA";
    if (val === false) return "NE";
    return "Nije uneseno";
}

// PDF Fill functions (unchanged)
function fillPdfForEntry(doc, data, idx = null) {
    function section(tekst) {
        doc.fontSize(14).fillColor('#222').font('dejavu').text(tekst, { underline: true })
            .moveDown(0.2).fillColor('black').fontSize(12);
    }
    if (idx !== null) {
        doc.addPage({ margin: 48 });
        doc.fontSize(18).fillColor('#024878').text(`Prijava sudionika ${idx + 1}`, { underline: false })
            .fillColor('black').fontSize(12).moveDown(1.0);
    }
    const n = data.nesreca || {};
    section('Podaci o nesreći');
    doc.text(`Datum nesreće: ${safe(n.datum_nesrece)}`)
        .text(`Vrijeme nesreće: ${safe(n.vrijeme_nesrece)}`)
        .text(`Mjesto nesreće: ${safe(n.mjesto_nesrece)}`);
    doc.text(`Ozlijeđeni: ${daNeNije(n.ozlijedeneososbe)}`);
    doc.text(`Šteta na vozilu: ${daNeNije(n.stetanavozilima)}`);
    doc.text(`Šteta na stvarima: ${daNeNije(n.stetanastvarima)}`)
        .moveDown();

    section('Opis nesreće');
    const opis = data.opis || {};
    doc.text('Tip(ovi) okolnosti:');
    if (opis.tip_okolnost && opis.tip_okolnost.length > 0) {
        opis.tip_okolnost.forEach((tip, idx) => {
            doc.text(`   ${idx + 1}. ${tip}`);
        });
    } else {
        doc.text('   Nije uneseno');
    }
    doc.text(`Opis okolnosti: ${safe(opis.opis_okolnost)}`);
    doc.text(`Pozicija oštećenja: ${safe(opis.polozaj_ostecenja)}`);
    doc.text(`Opis oštećenja: ${safe(opis.opis_ostecenja)}`);
    doc.text(`Broj priloženih slika: ${opis.slike && opis.slike.length ? opis.slike.length : "Nije uneseno"}`);
    doc.moveDown();

    section('Svjedoci');
    const svjedoci = (data.svjedoci && data.svjedoci.lista) ? data.svjedoci.lista : [];
    if (svjedoci.length === 0) {
        doc.text('Nema unesenih svjedoka.');
    } else {
        svjedoci.forEach((s, i) => {
            doc.font('dejavu').text(`Svjedok ${i + 1}:`);
            doc.text(`   Ime i prezime: ${safe(s.ime)}`);
            doc.text(`   Adresa: ${safe(s.adresa)}`);
            doc.text(`   Kontakt: ${safe(s.kontakt)}`);
            doc.moveDown(0.3);
        });
    }
    doc.moveDown();
    section('Osiguranik i vozač');
    const os = data.vozacOsiguranik || {};
    doc.text(`Ime: ${safe(os.ime_osiguranika)}`)
        .text(`Prezime: ${safe(os.prezime_osiguranika)}`)
        .text(`Adresa: ${safe(os.adresa_osiguranika)}`)
        .text(`Poštanski broj: ${safe(os.postanskibroj_osiguranika)}`)
        .text(`Država: ${safe(os.drzava_osiguranika)}`)
        .text(`Email: ${safe(os.mail_osiguranika)}`)
        .text(`Kontakt: ${safe(os.kontaktbroj_osiguranika)}`)
        .text(`IBAN: ${safe(Array.isArray(os.iban_osiguranika) ? os.iban_osiguranika[0] : os.iban_osiguranika)}`)
        .text(`Isti kao vozač: ${daNeNije(os.isti)}`)
        .moveDown();
    section('Podaci o vozilu');
    const vozilo = data.vozilo || {};
    doc.text(`Registracija: ${safe(vozilo.registarskaoznaka_vozila)}`)
        .text(`Marka: ${safe(vozilo.marka_vozila)}`)
        .text(`Tip: ${safe(vozilo.tip_vozila)}`)
        .text(`Šasija: ${safe(vozilo.brojsasije_vozila)}`)
        .text(`Kilometraža: ${safe(vozilo.kilometraza)}`)
        .text(`Godina proizvodnje: ${safe(vozilo.godinaproizvodnje_vozilo)}`)
        .moveDown();
    section('Osiguravajuće društvo');
    const osig = data.osiguranje || {};
    doc.text(`Naziv: ${safe(osig.naziv_osiguranja)}`)
        .text(`Adresa: ${safe(osig.adresa_osiguranja)}`)
        .text(`Država: ${safe(osig.drzava_osiguranja)}`)
        .text(`Email: ${safe(osig.mail_osiguranja)}`)
        .text(`Kontakt: ${safe(osig.kontaktbroj_osiguranja)}`)
        .moveDown();
    section('Polica osiguranja');
    const polica = data.polica || {};
    doc.text(`Broj police: ${safe(polica.brojpolice)}`)
        .text(`Broj zelene karte: ${safe(polica.brojzelenekarte)}`)
        .text(`Kasko: ${polica.kaskopokrivastetu === true ? "DA" : (polica.kaskopokrivastetu === false ? "NE" : "Nije uneseno")}`)
        .moveDown();
    section("Potpisi");
    if (data.potpis && data.potpis.potpis_a) {
        doc.text("Potpis A:");
        try {
            doc.image(Buffer.from(data.potpis.potpis_a, 'base64'), { width: 120, height: 60 });
        } catch { doc.text("Potpis nije moguće prikazati."); }
    } else {
        doc.text("Potpis A: Nije uneseno");
    }
    if (data.potpis && data.potpis.potpis_b) {
        doc.text("Potpis B:");
        try {
            doc.image(Buffer.from(data.potpis.potpis_b, 'base64'), { width: 120, height: 60 });
        } catch { doc.text("Potpis nije moguće prikazati."); }
    } else {
        doc.text("Potpis B: Nije uneseno");
    }
    doc.text(`Datum potpisa: ${formatDate(data.potpis?.datum_potpisa)}`).moveDown();
}

// PDF buffer generator
function generatePdfBuffer(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 48 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const fontPath = path.join(__dirname, '..', 'public', 'fonts', 'DejaVuSans.ttf');
        doc.registerFont('dejavu', fontPath);
        doc.font('dejavu');

        doc.fontSize(20)
            .text('Potvrda o podnošenju zahtjeva', { align: 'center', underline: true })
            .moveDown(1.3);

        if (Array.isArray(data.single_mode_entries) && data.single_mode_entries.length > 0) {
            data.single_mode_entries.forEach((entry, idx) => {
                fillPdfForEntry(doc, entry, idx);
            });
        } else {
            fillPdfForEntry(doc, data, null);
        }

        doc.moveDown();
        doc.fontSize(10).fillColor('#555')
            .text('Polja "Nije uneseno" označavaju informacije koje nisu unešene prilikom ispunjavanja.', { align: 'left' }).fillColor('black');

        doc.end();
    });
}

// Nodemailer config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
});

// POST /generate-pdf-and-send -- SANITIZIRANA VERZIJA
router.post('/generate-pdf-and-send', async (req, res) => {
    try {
        const { mail, data } = req.body;
        // Validate email field
        let toField;
        if (Array.isArray(mail)) {
            toField = mail.filter(Boolean).join(",");
        } else {
            toField = mail;
        }
        if (!toField || typeof toField !== "string" || toField.trim() === "") {
            console.error("Primljeno mail polje:", mail);
            return res.status(400).json({ error: "Primatelj(e) e-mail polje prazno ili neispravno." });
        }
        if (!data) return res.status(400).json({ error: 'Nedostaju podaci za PDF.' });

        const pdfBuffer = await generatePdfBuffer(data);

        await transporter.sendMail({
            from: process.env.FROM_EMAIL || process.env.NODEMAILER_USER,
            to: toField,
            subject: 'Potvrda o podnošenju zahtjeva',
            text: 'U privitku je PDF s podacima koje ste unijeli.',
            attachments: [
                { filename: 'Potvrda.pdf', content: pdfBuffer }
            ]
        });

        res.json({ success: true, message: "PDF poslan na email osiguranika." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'Greška pri izradi/slanju PDF-a' });
    }
});

module.exports = router;
