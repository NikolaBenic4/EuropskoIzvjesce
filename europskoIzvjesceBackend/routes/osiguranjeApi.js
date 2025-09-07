const express = require('express');
const router = express.Router();
const pool = require('../db');

// SUGGESTIONS: autocomplete lista naziva
router.get('/suggestions', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  try {
    const result = await pool.query(
      'SELECT naziv_osiguranja FROM osiguranje WHERE LOWER(naziv_osiguranja) LIKE LOWER($1) ORDER BY naziv_osiguranja LIMIT 10',
      [`%${q}%`]
    );
    res.json(result.rows.map(row => row.naziv_osiguranja));
  } catch (e) {
    res.status(500).json([]);
  }
});

// DODAJ OVO: automatsko popunjavanje detalja
router.get('/', async (req, res) => {
  const { naziv } = req.query;
  if (!naziv) return res.status(400).json({});
  try {
    const result = await pool.query(
      'SELECT adresa_osiguranja, drzava_osiguranja, mail_osiguranja, kontaktbroj_osiguranja FROM osiguranje WHERE naziv_osiguranja = $1 LIMIT 1',
      [naziv]
    );
    if (result.rows.length === 0) return res.json({});
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({});
  }
});

module.exports = router;
