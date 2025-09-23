// routes/pdfRoutes.js - AŽURIRANI PDF GENERATOR

const express = require("express");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
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
    if (val === true || val === "true" || val === "DA") return "DA";
    if (val === false || val === "false" || val === "NE") return "NE";
    return "Nije uneseno";
}

// EU Colors
const EU_BLUE = '#003399';
const EU_YELLOW = '#FFCC00';
const LIGHT_GRAY = '#F5F5F5';
const DARK_GRAY = '#333333';
const BORDER_GRAY = '#CCCCCC';

// Font registracija
function registerFonts(doc) {
    try {
        const fontDir = path.join(__dirname, '..', 'public', 'fonts');
        doc.registerFont('DejaVu-Regular', path.join(fontDir, 'DejaVuSans.ttf'));
        doc.registerFont('DejaVu-Bold', path.join(fontDir, 'DejaVuSans-Bold.ttf'));
    } catch (e) {
        console.warn('DejaVu font nije pronađen, koristim standardni font');
        doc.registerFont('DejaVu-Regular', 'Helvetica');
        doc.registerFont('DejaVu-Bold', 'Helvetica-Bold');
    }
}

// PDF funkcije
function drawHeader(doc) {
    doc.rect(0, 0, doc.page.width, 80).fill(EU_BLUE);
    
    doc.fillColor(EU_YELLOW);
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30) * Math.PI / 180;
        const x = 60 + 25 * Math.cos(angle);
        const y = 40 + 25 * Math.sin(angle);
        doc.circle(x, y, 3).fill();
    }
    
    doc.fillColor('white')
       .fontSize(24)
       .font('DejaVu-Bold')
       .text('DIGITALNO EUROPSKO IZVJEŠĆE', 120, 25);
    
    doc.fillColor('white')
       .fontSize(12)
       .font('DejaVu-Regular')
       .text('Prijava i zahtjev za naknadu štete - Automobilsko osiguranje', 120, 50);
    
    doc.y = 100;
}

function drawSection(doc, title) {
    if (doc.y > doc.page.height - 150) {
        doc.addPage({ margin: 40 });
        drawHeader(doc);
    }
    
    const currentY = doc.y;
    doc.rect(doc.page.margins.left - 10, currentY - 5, doc.page.width - doc.page.margins.left - doc.page.margins.right + 20, 25)
       .fill(EU_BLUE);
    
    doc.fillColor('white')
       .fontSize(14)
       .font('DejaVu-Bold')
       .text(title, doc.page.margins.left, currentY + 3);
    
    doc.moveDown(0.8);
    doc.fillColor(DARK_GRAY).fontSize(11).font('DejaVu-Regular');
}

function drawTable(doc, headers, rows) {
    if (!rows || rows.length === 0) return;
    
    const itemHeight = 20;
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = tableWidth / headers.length;
    
    const totalTableHeight = (rows.length + 1) * itemHeight;
    if (doc.y + totalTableHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage({ margin: 40 });
        drawHeader(doc);
        doc.y = 120;
    }
    
    const finalTableTop = doc.y;
    
    doc.rect(doc.page.margins.left, finalTableTop, tableWidth, itemHeight).fill(EU_BLUE);
    doc.fillColor('white').fontSize(10).font('DejaVu-Bold');
    
    headers.forEach((header, i) => {
        doc.text(header, 
            doc.page.margins.left + (i * colWidth) + 5, 
            finalTableTop + 5, 
            { width: colWidth - 10, align: 'left' }
        );
    });
    
    let currentTop = finalTableTop + itemHeight;
    rows.forEach((row, rowIndex) => {
        const bgColor = rowIndex % 2 === 0 ? 'white' : LIGHT_GRAY;
        doc.rect(doc.page.margins.left, currentTop, tableWidth, itemHeight).fill(bgColor);
        
        doc.fillColor('black').fontSize(9).font('DejaVu-Regular');
        row.forEach((cell, i) => {
            doc.text(String(cell), 
                doc.page.margins.left + (i * colWidth) + 5, 
                currentTop + 5, 
                { width: colWidth - 10, align: 'left' }
            );
        });
        currentTop += itemHeight;
    });
    
    doc.rect(doc.page.margins.left, finalTableTop, tableWidth, currentTop - finalTableTop)
       .stroke(BORDER_GRAY);
    
    doc.y = currentTop + 10;
}

// AŽURIRANA FUNKCIJA ZA DOHVAĆANJE IZ BAZE
async function fetchFullAccidentData(nesrecaId) {
    const client = await db.connect();
    try {
        console.log('🔍 Dohvaćam podatke za nesreću:', nesrecaId);
        
        const nesrecaQuery = await client.query(
            `SELECT * FROM nesreca WHERE id_nesrece = $1`,
            [nesrecaId]
        );
        
        if (nesrecaQuery.rows.length === 0) {
            throw new Error(`Nesreća s ID ${nesrecaId} nije pronađena`);
        }
        
        const nesreca = nesrecaQuery.rows[0];
        
        const okolnostQuery = await client.query(
            `SELECT * FROM okolnost WHERE id_nesrece = $1`,
            [nesrecaId]
        );
        
        const svjedociQuery = await client.query(
            `SELECT * FROM svjedok WHERE id_nesrece = $1`,
            [nesrecaId]
        );
        
        // KLJUČNA ISPRAVA - dohvati sudio.nike s JOIN-ovima
        const sudionikQuery = await client.query(`
            SELECT 
                s.tip_sudionika,
                s.potpis_sudionika,
                s.datumpotpisa_sudionika,
                s.id_nesrece,
                s.registarskaoznaka_vozila,
                s.id_vozaca,
                s.id_osiguranje,
                -- vozilo podaci
                v.marka_vozila,
                v.tip_vozila,
                v.drzavaregistracije_vozila,
                v.brojsasije_vozila,
                v.kilometraza_vozila,
                v.godinaproizvodnje_vozilo,
                -- vozac podaci
                vz.ime_vozaca,
                vz.prezime_vozaca,
                vz.adresa_vozaca,
                vz.postanskibroj_vozaca,
                vz.drzava_vozaca,
                vz.kontaktbroj_vozaca,
                vz.mail_vozaca,
                vz.brojvozackedozvole,
                vz.kategorijavozackedozvole,
                vz.valjanostvozackedozvole,
                -- osiguranje podaci
                os.naziv_osiguranja,
                os.adresa_osiguranja,
                os.drzava_osiguranja,
                os.mail_osiguranja,
                os.kontaktbroj_osiguranja,
                -- osiguranik podaci
                osi.ime_osiguranika,
                osi.prezime_osiguranika,
                osi.adresa_osiguranika,
                osi.postanskibroj_osiguranika,
                osi.drzava_osiguranika,
                osi.kontaktbroj_osiguranika,
                osi.mail_osiguranika,
                osi.iban_osiguranika,
                -- polica podaci
                p.brojpolice,
                p.brojzelenekarte,
                p.kaskopokrivastetu
            FROM sudionik s
            LEFT JOIN vozilo v ON s.registarskaoznaka_vozila = v.registarskaoznaka_vozila
            LEFT JOIN vozac vz ON s.id_vozaca = vz.id_vozaca
            LEFT JOIN osiguranje os ON s.id_osiguranje = os.id_osiguranje
            LEFT JOIN osiguranik osi ON os.id_osiguranika = osi.id_osiguranika
            LEFT JOIN polica_osiguranja p ON (os.id_osiguranje = p.id_osiguranje AND osi.id_osiguranika = p.id_osiguranika)
            WHERE s.id_nesrece = $1
            ORDER BY s.tip_sudionika
        `, [nesrecaId]);
        
        const slikeQuery = await client.query(
            `SELECT naziv_slike, vrijeme_slikanja FROM slika WHERE id_nesrece = $1`,
            [nesrecaId]
        );
        
        console.log('✅ Svi podaci uspješno dohvaćeni iz baze');
        
        return {
            nesreca,
            okolnosti: okolnostQuery.rows,
            svjedoci: svjedociQuery.rows,
            sudionici: sudionikQuery.rows,
            slike: slikeQuery.rows
        };
        
    } catch (error) {
        console.error('❌ Greška pri dohvaćanju podataka iz baze:', error);
        throw error;
    } finally {
        client.release();
    }
}

// KLJUČNA ISPRAVA - fillPdfForEntry s fallback logikom
function fillPdfForEntry(doc, data, dbData = null, idx = null) {
    console.log('📄 === POČETAK PDF GENERIRANJA ===');
    console.log('📄 dbData available:', !!dbData);
    console.log('📄 frontend data available:', !!data.vozacOsiguranik);
    
    if (idx !== null) {
        doc.addPage({ margin: 40 });
        drawHeader(doc);
        
        doc.fillColor(EU_BLUE)
           .fontSize(18)
           .font('DejaVu-Bold')
           .text(`SUDIONIK ${String.fromCharCode(65 + idx)}`, { align: 'center' });
        doc.moveDown(1);
    }

    // PODACI O NESREĆI
    const n = dbData?.nesreca || data.nesreca || {};
    drawSection(doc, 'PODACI O NESREĆI');
    drawTable(doc, ['Podatak', 'Vrijednost'], [
        ['ID nesreće', safe(n.id_nesrece)],
        ['Datum nesreće', formatDate(n.datum_nesrece)],
        ['Vrijeme nesreće', safe(n.vrijeme_nesrece)],
        ['Mjesto nesreće', safe(n.mjesto_nesrece)],
        ['Ozlijeđene osobe', daNeNije(n.ozlijedeneososbe)],
        ['Šteta na vozilima', daNeNije(n.stetanavozilima)],
        ['Šteta na stvarima', daNeNije(n.stetanastvarima)],
        ['Geolokacija', safe(n.geolokacija_nesrece)]
    ]);

    // OKOLNOSTI NESREĆE
    const okolnosti = dbData?.okolnosti?.[0] || data.opis || {};
    drawSection(doc, 'OKOLNOSTI NESREĆE');
    drawTable(doc, ['Podatak', 'Vrijednost'], [
        ['Opis okolnosti', safe(okolnosti.opis_okolnost || okolnosti.opis_nesrece)],
        ['Tip okolnosti', safe(okolnosti.tip_okolnost)],
        ['Pozicija oštećenja', safe(data.opis?.polozaj_ostecenja)],
        ['Opis oštećenja', safe(data.opis?.opis_ostecenja)],
        ['Broj slika', dbData?.slike?.length || data.opis?.slike?.length || 0]
    ]);

    // SVJEDOCI
    drawSection(doc, 'SVJEDOCI');
    if (dbData?.svjedoci?.length > 0) {
        const svjedociRows = [];
        dbData.svjedoci.forEach(svjedok => {
            const imena = svjedok.ime_prezime_svjedok || [];
            const adrese = svjedok.adresa_svjedok || [];
            const kontakti = svjedok.kontakt_svjedok || [];
            const maxLength = Math.max(imena.length, adrese.length, kontakti.length);
            
            for (let i = 0; i < maxLength; i++) {
                svjedociRows.push([
                    `Svjedok ${svjedociRows.length + 1}`,
                    safe(imena[i] || ''),
                    safe(adrese[i] || ''),
                    safe(kontakti[i] || '')
                ]);
            }
        });
        if (svjedociRows.length > 0) {
            drawTable(doc, ['#', 'Ime i prezime', 'Adresa', 'Kontakt'], svjedociRows);
        } else {
            drawTable(doc, ['Status'], [['Nema unesenih svjedoka']]);
        }
    } else if (data.svjedoci?.lista?.length > 0) {
        const svjedociRows = data.svjedoci.lista.map((s, i) => [
            `Svjedok ${i + 1}`,
            safe(s.ime),
            safe(s.adresa),
            safe(s.kontakt)
        ]);
        drawTable(doc, ['#', 'Ime i prezime', 'Adresa', 'Kontakt'], svjedociRows);
    } else {
        drawTable(doc, ['Status'], [['Nema unesenih svjedoka']]);
    }

    // KLJUČNA ISPRAVA - PRIMARNO KORISTI BAZU, FALLBACK NA FRONTEND
    let currentSudionik = null;
    if (dbData?.sudionici?.length > 0) {
        const targetLetter = idx !== null ? String.fromCharCode(65 + idx) : 'A';
        currentSudionik = dbData.sudionici.find(s => s.tip_sudionika === targetLetter) || dbData.sudionici[0];
        console.log(`📋 Koristim sudionika iz baze ${targetLetter}:`, !!currentSudionik);
    }

    // NOVA STRANICA ZA PODATKE O OSIGURANIKU
    doc.addPage({ margin: 40 });
    drawHeader(doc);
    
    drawSection(doc, 'PODACI OSIGURANIKA');
    
    let osiguranikData;
    if (currentSudionik) {
        // KORISTI BAZU
        console.log('📋 Koristim podatke osiguranika iz baze');
        osiguranikData = [
            ['Ime', safe(currentSudionik.ime_osiguranika)],
            ['Prezime', safe(currentSudionik.prezime_osiguranika)],
            ['Adresa', safe(currentSudionik.adresa_osiguranika)],
            ['Poštanski broj', safe(currentSudionik.postanskibroj_osiguranika)],
            ['Država', safe(currentSudionik.drzava_osiguranika)],
            ['Email', safe(currentSudionik.mail_osiguranika)],
            ['Kontakt telefon', safe(currentSudionik.kontaktbroj_osiguranika)],
            ['IBAN račun', safe(Array.isArray(currentSudionik.iban_osiguranika) ? currentSudionik.iban_osiguranika.join(', ') : currentSudionik.iban_osiguranika)]
        ];
    } else {
        // FALLBACK NA FRONTEND
        console.log('📋 Koristim podatke osiguranika iz frontend-a');
        const os = data.vozacOsiguranik || {};
        const osiguranik = os.osiguranik || {
            ime_osiguranika: os.ime_osiguranika,
            prezime_osiguranika: os.prezime_osiguranika,
            adresa_osiguranika: os.adresa_osiguranika,
            postanskibroj_osiguranika: os.postanskibroj_osiguranika,
            drzava_osiguranika: os.drzava_osiguranika,
            kontaktbroj_osiguranika: os.kontaktbroj_osiguranika,
            mail_osiguranika: os.mail_osiguranika
        };
        osiguranikData = [
            ['Ime', safe(osiguranik.ime_osiguranika)],
            ['Prezime', safe(osiguranik.prezime_osiguranika)],
            ['Adresa', safe(osiguranik.adresa_osiguranika)],
            ['Poštanski broj', safe(osiguranik.postanskibroj_osiguranika)],
            ['Država', safe(osiguranik.drzava_osiguranika)],
            ['Email', safe(osiguranik.mail_osiguranika)],
            ['Kontakt telefon', safe(osiguranik.kontaktbroj_osiguranika)],
            ['IBAN račun', safe(os.iban_osiguranika)]
        ];
    }
    
    drawTable(doc, ['Podatak', 'Vrijednost'], osiguranikData);

    // PODACI VOZAČA
    drawSection(doc, 'PODACI VOZAČA');
    
    let vozacData;
    if (currentSudionik) {
        // KORISTI BAZU
        console.log('📋 Koristim podatke vozača iz baze');
        vozacData = [
            ['Ime', safe(currentSudionik.ime_vozaca)],
            ['Prezime', safe(currentSudionik.prezime_vozaca)],
            ['Adresa', safe(currentSudionik.adresa_vozaca)],
            ['Poštanski broj', safe(currentSudionik.postanskibroj_vozaca)],
            ['Država', safe(currentSudionik.drzava_vozaca)],
            ['Email', safe(currentSudionik.mail_vozaca)],
            ['Kontakt telefon', safe(currentSudionik.kontaktbroj_vozaca)],
            ['Broj vozačke dozvole', safe(currentSudionik.brojvozackedozvole)],
            ['Kategorija dozvole', safe(currentSudionik.kategorijavozackedozvole)],
            ['Valjanost dozvole', formatDate(currentSudionik.valjanostvozackedozvole)]
        ];
    } else {
        // FALLBACK NA FRONTEND
        console.log('📋 Koristim podatke vozača iz frontend-a');
        const os = data.vozacOsiguranik || {};
        const vozac = os.vozac || {};
        const osiguranik = os.osiguranik || {
            ime_osiguranika: os.ime_osiguranika,
            prezime_osiguranika: os.prezime_osiguranika,
            adresa_osiguranika: os.adresa_osiguranika,
            postanskibroj_osiguranika: os.postanskibroj_osiguranika,
            drzava_osiguranika: os.drzava_osiguranika,
            kontaktbroj_osiguranika: os.kontaktbroj_osiguranika,
            mail_osiguranika: os.mail_osiguranika
        };
        const jeIsti = os.isti || false;
        
        if (jeIsti) {
            vozacData = [
                ['Ime', safe(osiguranik.ime_osiguranika)],
                ['Prezime', safe(osiguranik.prezime_osiguranika)],
                ['Adresa', safe(osiguranik.adresa_osiguranika)],
                ['Poštanski broj', safe(osiguranik.postanskibroj_osiguranika)],
                ['Država', safe(osiguranik.drzava_osiguranika)],
                ['Email', safe(osiguranik.mail_osiguranika)],
                ['Kontakt telefon', safe(osiguranik.kontaktbroj_osiguranika)],
                ['Broj vozačke dozvole', safe(vozac.brojvozackedozvole || os.brojvozackedozvole)],
                ['Kategorija dozvole', safe(vozac.kategorijavozackedozvole || os.kategorijavozackedozvole)],
                ['Valjanost dozvole', formatDate(vozac.valjanostvozackedozvole || os.valjanostvozackedozvole)],
                ['Isti kao osiguranik', 'DA']
            ];
        } else {
            vozacData = [
                ['Ime', safe(vozac.ime_vozaca)],
                ['Prezime', safe(vozac.prezime_vozaca)],
                ['Adresa', safe(vozac.adresa_vozaca)],
                ['Poštanski broj', safe(vozac.postanskibroj_vozaca)],
                ['Država', safe(vozac.drzava_vozaca)],
                ['Email', safe(vozac.mail_vozaca)],
                ['Kontakt telefon', safe(vozac.kontaktbroj_vozaca)],
                ['Broj vozačke dozvole', safe(vozac.brojvozackedozvole)],
                ['Kategorija dozvole', safe(vozac.kategorijavozackedozvole)],
                ['Valjanost dozvole', formatDate(vozac.valjanostvozackedozvole)],
                ['Isti kao osiguranik', 'NE']
            ];
        }
    }
    
    drawTable(doc, ['Podatak', 'Vrijednost'], vozacData);
    
    // NOVA STRANICA ZA VOZILO
    doc.addPage({ margin: 40 });
    drawHeader(doc);
    
    drawSection(doc, 'PODACI O VOZILU');
    
    let voziloData;
    if (currentSudionik) {
        // KORISTI BAZU
        console.log('📋 Koristim podatke vozila iz baze');
        voziloData = [
            ['Registracija', safe(currentSudionik.registarskaoznaka_vozila)],
            ['Marka i model', safe(currentSudionik.marka_vozila)],
            ['Tip vozila', safe(currentSudionik.tip_vozila)],
            ['Država registracije', safe(currentSudionik.drzavaregistracije_vozila)],
            ['Broj šasije', safe(currentSudionik.brojsasije_vozila)],
            ['Kilometraža', safe(currentSudionik.kilometraza_vozila)],
            ['Godina proizvodnje', safe(currentSudionik.godinaproizvodnje_vozilo)]
        ];
    } else {
        // FALLBACK NA FRONTEND
        console.log('📋 Koristim podatke vozila iz frontend-a');
        const vozilo = data.vozilo || {};
        voziloData = [
            ['Registracija', safe(vozilo.registarskaoznaka_vozila)],
            ['Marka i model', safe(vozilo.marka_vozila)],
            ['Tip vozila', safe(vozilo.tip_vozila)],
            ['Država registracije', safe(vozilo.drzavaregistracije_vozila)],
            ['Broj šasije', safe(vozilo.brojsasije_vozila)],
            ['Kilometraža', safe(vozilo.kilometraza_vozila)],
            ['Godina proizvodnje', safe(vozilo.godinaproizvodnje_vozilo)]
        ];
    }
    
    drawTable(doc, ['Podatak', 'Vrijednost'], voziloData);

    // OSIGURANJE I POLICA
    drawSection(doc, 'OSIGURANJE I POLICA');
    
    let osiguranjePolicaData;
    if (currentSudionik) {
        // KORISTI BAZU
        console.log('📋 Koristim podatke osiguranja iz baze');
        osiguranjePolicaData = [
            ['Naziv osiguranja', safe(currentSudionik.naziv_osiguranja)],
            ['ID osiguranja', safe(currentSudionik.id_osiguranje)],
            ['Broj police', safe(currentSudionik.brojpolice)],
            ['Broj zelene karte', safe(currentSudionik.brojzelenekarte)],
            ['Kasko osiguranje', daNeNije(currentSudionik.kaskopokrivastetu)],
            ['Adresa osiguranja', safe(currentSudionik.adresa_osiguranja)],
            ['Email osiguranja', safe(currentSudionik.mail_osiguranja)],
            ['Kontakt osiguranja', safe(currentSudionik.kontaktbroj_osiguranja)]
        ];
    } else {
        // FALLBACK NA FRONTEND
        console.log('📋 Koristim podatke osiguranja iz frontend-a');
        const osig = data.osiguranje || {};
        const polica = data.polica || {};
        osiguranjePolicaData = [
            ['Naziv osiguranja', safe(osig.naziv_osiguranja)],
            ['ID osiguranja', safe(osig.id_osiguranje)],
            ['Broj police', safe(polica.brojpolice)],
            ['Broj zelene karte', safe(polica.brojzelenekarte)],
            ['Kasko osiguranje', daNeNije(polica.kaskopokrivastetu)],
            ['Adresa osiguranja', safe(osig.adresa_osiguranja)],
            ['Email osiguranja', safe(osig.mail_osiguranja)],
            ['Kontakt osiguranja', safe(osig.kontaktbroj_osiguranja)]
        ];
    }
    
    drawTable(doc, ['Podatak', 'Vrijednost'], osiguranjePolicaData);

    // POTPIS
    if (currentSudionik && currentSudionik.potpis_sudionika) {
        console.log('📋 Dodajem potpis iz baze');
        doc.addPage({ margin: 40 });
        drawHeader(doc);
        
        drawSection(doc, 'POTPIS');
        
        try {
            const potpisWidth = 300;
            const potpisHeight = 100;
            const startX = doc.page.margins.left;
            const startY = doc.y + 20;
            
            doc.rect(startX, startY, potpisWidth, potpisHeight + 40).stroke(BORDER_GRAY);
            doc.fillColor(DARK_GRAY).fontSize(14).font('DejaVu-Bold')
               .text(`POTPIS SUDIONIKA ${currentSudionik.tip_sudionika}`, startX + 10, startY + 10);
            
            doc.image(currentSudionik.potpis_sudionika, startX + 10, startY + 35, { 
                width: potpisWidth - 20, 
                height: potpisHeight - 10 
            });
            
            doc.y = startY + potpisHeight + 50;
            doc.fillColor(DARK_GRAY).fontSize(11).font('DejaVu-Regular')
               .text(`Datum potpisa: ${formatDate(currentSudionik.datumpotpisa_sudionika)}`, { align: 'right' });
               
        } catch (e) {
            console.error('❌ Greška pri dodavanju potpisa:', e);
            drawTable(doc, ['Potpis'], [['Greška pri učitavanju potpisa']]);
        }
    } else if (data.potpis && (data.potpis.potpis_a || data.potpis.potpis_b || data.potpis.potpis)) {
        console.log('📋 Dodajem potpis iz frontend-a');
        doc.addPage({ margin: 40 });
        drawHeader(doc);
        
        drawSection(doc, 'POTPIS');
        
        try {
            const potpisWidth = 300;
            const potpisHeight = 100;
            const startX = doc.page.margins.left;
            const startY = doc.y + 20;
            
            let potpisData = data.potpis.potpis || data.potpis.potpis_a || data.potpis.potpis_b;
            let potpisSudionik = data.tip_sudionika || 'A';
            
            doc.rect(startX, startY, potpisWidth, potpisHeight + 40).stroke(BORDER_GRAY);
            doc.fillColor(DARK_GRAY).fontSize(14).font('DejaVu-Bold')
               .text(`POTPIS SUDIONIKA ${potpisSudionik}`, startX + 10, startY + 10);
            
            doc.image(Buffer.from(potpisData, 'base64'), startX + 10, startY + 35, { 
                width: potpisWidth - 20, 
                height: potpisHeight - 10 
            });
            
            doc.y = startY + potpisHeight + 50;
            doc.fillColor(DARK_GRAY).fontSize(11).font('DejaVu-Regular')
               .text(`Datum potpisa: ${formatDate(data.potpis.datum_potpisa)}`, { align: 'right' });
               
        } catch (e) {
            console.error('❌ Greška pri dodavanju potpisa:', e);
            drawTable(doc, ['Potpis'], [['Greška pri učitavanju potpisa']]);
        }
    }
    
    console.log('📄 === KRAJ PDF GENERIRANJA ===');
}

// PDF buffer generator
async function generatePdfBuffer(data) {
    return new Promise(async (resolve, reject) => {
        console.log('🚀 === POČETAK PDF BUFFER GENERIRANJA ===');
        console.log('🚀 nesrecaId:', data.nesreca?.id_nesrece);
        
        const doc = new PDFDocument({ 
            margin: 40,
            size: 'A4'
        });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            console.log('✅ PDF buffer generiran');
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);

        try {
            registerFonts(doc);
            doc.font('DejaVu-Regular');
            drawHeader(doc);
            
            doc.fillColor(DARK_GRAY)
               .fontSize(12)
               .font('DejaVu-Regular')
               .text('Službeni dokument za prijavu prometne nesreće prema europskim standardima', { align: 'center' })
               .moveDown(1);
            
            doc.fillColor('black')
               .fontSize(10)
               .text(`Datum generiranja: ${formatDate(new Date().toISOString())}`, { align: 'right' })
               .moveDown(1);

            // Pokušaj dohvatiti podatke iz baze
            let dbData = null;
            if (data.nesreca?.id_nesrece) {
                try {
                    console.log('🔍 Dohvaćam podatke iz baze za nesreću:', data.nesreca.id_nesrece);
                    dbData = await fetchFullAccidentData(data.nesreca.id_nesrece);
                    console.log('✅ Podaci iz baze uspješno dohvaćeni');
                } catch (dbError) {
                    console.warn('⚠️ Greška pri dohvaćanju iz baze, koristim frontend podatke:', dbError.message);
                    dbData = null;
                }
            } else {
                console.log('ℹ️ Nema ID nesreće, koristim frontend podatke');
            }

            fillPdfForEntry(doc, data, dbData, null);

            // NAPOMENE stranica
            doc.addPage({ margin: 40 });
            drawHeader(doc);
            
            drawSection(doc, 'NAPOMENE');
            doc.fillColor(DARK_GRAY)
               .fontSize(10)
               .font('DejaVu-Regular')
               .text('• Sva polja označena s "Nije uneseno" predstavljaju informacije koje nisu bile dostupne prilikom podnošenja zahtjeva.')
               .text('• Ovaj dokument služi kao potvrda o uspješno podnešenom zahtjevu za naknadu štete.')
               .text('• Za dodatne informacije kontaktirajte vaše osiguravajuće društvo.')
               .text('• Dokument je generiran automatski sustavom digitalnog europskog izvješća.')
               .moveDown(2);
            
            doc.fillColor(DARK_GRAY)
               .fontSize(12)
               .font('DejaVu-Bold')
               .text('Potpis ovlaštene osobe:', doc.page.margins.left, doc.page.height - 120);
            
            doc.strokeColor(DARK_GRAY)
               .lineWidth(1)
               .moveTo(doc.page.margins.left + 150, doc.page.height - 105)
               .lineTo(doc.page.margins.left + 350, doc.page.height - 105)
               .stroke();
            
            doc.fillColor(DARK_GRAY)
               .fontSize(10)
               .font('DejaVu-Regular')
               .text('Digitalni sustav europskog izvješća', doc.page.margins.left + 150, doc.page.height - 90)
               .text(`Zagreb, ${formatDate(new Date().toISOString())}`, doc.page.margins.left + 150, doc.page.height - 75);

            doc.end();
        } catch (error) {
            console.error('❌ PDF generation error:', error);
            reject(error);
        }
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

// POST /generate-pdf-and-send
router.post('/generate-pdf-and-send', async (req, res) => {
    try {
        const { mail, data } = req.body;
        
        console.log('📧 === POČETAK PDF GENERIRANJA I SLANJA ===');
        console.log('📧 Email destinacija:', mail);
        console.log('📊 Podaci:', {
            nesrecaId: data.nesreca?.id_nesrece,
            tipSudionika: data.tip_sudionika,
            hasVozilo: !!data.vozilo,
            hasOsiguranik: !!data.vozacOsiguranik
        });
        
        let toField;
        if (Array.isArray(mail)) {
            toField = mail.filter(Boolean).join(",");
        } else {
            toField = mail;
        }
        
        if (!toField || typeof toField !== "string" || toField.trim() === "") {
            return res.status(400).json({ error: "Email polje je prazno ili neispravno." });
        }
        
        if (!data) {
            return res.status(400).json({ error: 'Nedostaju podaci za PDF.' });
        }

        const pdfBuffer = await generatePdfBuffer(data);
        console.log('📄 PDF generated, size:', pdfBuffer.length, 'bytes');

        await transporter.sendMail({
            from: process.env.FROM_EMAIL || process.env.NODEMAILER_USER,
            to: toField,
            subject: 'Digitalno Europsko izvješće - Potvrda podnošenja zahtjeva',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #003399; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">DIGITALNO EUROPSKO IZVJEŠĆE</h1>
                        <p style="margin: 10px 0 0 0;">Potvrda o podnošenju zahtjeva</p>
                    </div>
                    <div style="padding: 20px; background-color: #f9f9f9;">
                        <p>Poštovani,</p>
                        <p>U privitku se nalazi službena potvrda o uspješno podnešenom zahtjevu za naknadu štete prema europskim standardima.</p>
                        <p>Dokument sadrži sve podatke koje ste unijeli tijekom procesa prijave nesreće.</p>
                        <p style="margin-top: 30px;">S poštovanjem,<br>
                        Sustav digitalnog europskog izvješća</p>
                    </div>
                </div>
            `,
            attachments: [
                { 
                    filename: 'Digitalno_Europsko_Izvjesce.pdf', 
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        console.log('✅ PDF uspješno poslan na email:', toField);
        console.log('📧 === KRAJ PDF GENERIRANJA I SLANJA ===');

        res.json({ 
            success: true, 
            message: "Digitalno europsko izvješće uspješno poslano na email." 
        });
        
    } catch (e) {
        console.error('❌ PDF Generation/Send Error:', e);
        res.status(500).json({ 
            error: e.message || 'Greška pri izradi/slanju digitalnog europskog izvješća' 
        });
    }
});

module.exports = router;