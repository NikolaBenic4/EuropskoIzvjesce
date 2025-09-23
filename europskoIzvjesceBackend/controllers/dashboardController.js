const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const secret = process.env.JWT_SECRET || 'tajni_kljuc';

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

// Middleware za provjeru tokena
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ');

  if (!token) return res.status(401).json({ error: 'Nema tokena' });

  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Nevažeći token' });
    req.user = decoded;
    next();
  });
};

// Dohvati zahtjevi po statusu
const getZahtjevi = async (req, res) => {
  try {
    const { status } = req.query;
    const { id_osiguranje } = req.user;

    let query = `
      SELECT 
        n.id_nesreca as id,
        n.datum_nesrece,
        n.mjesto_nesrece,
        o.ime_osiguranika,
        o.prezime_osiguranika,
        n.status
      FROM nesrece n
      JOIN osiguranik o ON n.id_nesreca = o.id_nesreca
      WHERE n.id_osiguranje = $1
    `;

    if (status === 'open') {
      query += " AND n.status = 'open'";
    } else if (status === 'closed') {
      query += " AND n.status = 'closed'";
    }

    query += " ORDER BY n.datum_nesrece DESC";

    const { rows } = await pool.query(query, [id_osiguranje]);
    res.json(rows);
  } catch (error) {
    console.error('Greška pri dohvaćanju zahtjeva:', error);
    res.status(500).json({ error: 'Greška na serveru' });
  }
};

// Dohvati detalje zahtjeva
const getZahtjev = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_osiguranje } = req.user;

    const query = `
      SELECT 
        n.*,
        o.*,
        v.*,
        ops.*,
        array_agg(
          json_build_object(
            'naziv_slike', s.naziv_slike,
            'podatak_slike', encode(s.podatak_slike, 'base64'),
            'vrijeme_slikanja', s.vrijeme_slikanja
          )
        ) as slike
      FROM nesrece n
      LEFT JOIN osiguranik o ON n.id_nesreca = o.id_nesreca
      LEFT JOIN vozac v ON n.id_nesreca = v.id_nesreca
      LEFT JOIN opis ops ON n.id_nesreca = ops.id_nesreca
      LEFT JOIN slike s ON n.id_nesreca = s.id_nesreca
      WHERE n.id_nesreca = $1 AND n.id_osiguranje = $2
      GROUP BY n.id_nesreca, o.id_osiguranik, v.id_vozac, ops.id_opis
    `;

    const { rows } = await pool.query(query, [id, id_osiguranje]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Zahtjev nije pronađen' });
    }

    res.json(rows);
  } catch (error) {
    console.error('Greška pri dohvaćanju zahtjeva:', error);
    res.status(500).json({ error: 'Greška na serveru' });
  }
};

// Ažuriraj iznos štete
const updateSteta = async (req, res) => {
  try {
    const { id } = req.params;
    const { iznos_stete, komentar } = req.body;
    const { id_osiguranje } = req.user;

    const query = `
      UPDATE nesrece 
      SET iznos_stete = $1, komentar = $2, updated_at = NOW()
      WHERE id_nesreca = $3 AND id_osiguranje = $4
    `;

    await pool.query(query, [iznos_stete, komentar, id, id_osiguranje]);
    res.json({ success: true });
  } catch (error) {
    console.error('Greška pri ažuriranju štete:', error);
    res.status(500).json({ error: 'Greška na serveru' });
  }
};

// Zatvori zahtjev
const closeZahtjev = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_osiguranje } = req.user;

    const query = `
      UPDATE nesrece 
      SET status = 'closed', closed_at = NOW()
      WHERE id_nesreca = $1 AND id_osiguranje = $2
    `;

    await pool.query(query, [id, id_osiguranje]);
    res.json({ success: true });
  } catch (error) {
    console.error('Greška pri zatvaranju zahtjeva:', error);
    res.status(500).json({ error: 'Greška na serveru' });
  }
};

module.exports = {
  authenticateToken,
  getZahtjevi,
  getZahtjev,
  updateSteta,
  closeZahtjev
};