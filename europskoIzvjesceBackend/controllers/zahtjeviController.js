const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

const secret = process.env.JWT_SECRET || 'tajni_kljuc';

async function getZahtjevi(req, res) {
  const token = req.headers['x-api-key'];
  if (!token) return res.status(401).json({ error: 'Nema tokena' });

  try {
    const decoded = jwt.verify(token, secret);
    const idOsiguranje = decoded.id_osiguranje;

    // Prvo dohvati id_nesrece povezan za ovo osiguranje
    const nesrecaQuery = 'SELECT id_nesrece FROM nesrece WHERE id_osiguranje = $1 LIMIT 1';
    const nesrecaResult = await pool.query(nesrecaQuery, [idOsiguranje]);
    if (nesrecaResult.rows.length === 0) {
      return res.json([]); // Nema nesreća --> nema zahtjeva
    }
    const idNesrece = nesrecaResult.rows[0].id_nesrece;

    // Dohvati zahtjeve po id_nesrece
    const zahtjeviQuery = 'SELECT id_nesrece, opis_nesrece, datum_nesrece FROM zahtjevi WHERE id_nesrece = $1 ORDER BY datum DESC';
    const zahtjeviResult = await pool.query(zahtjeviQuery, [idNesrece]);

    res.json(zahtjeviResult.rows);
  } catch (err) {
    console.error('Greška u getZahtjevi:', err.message);
    res.status(401).json({ error: 'Nevažeći token ili greška na serveru' });
  }
}

module.exports = { getZahtjevi };
