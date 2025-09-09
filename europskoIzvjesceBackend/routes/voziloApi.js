const express = require('express');
const router = express.Router();
const pool = require('../db');

// Normalize function: makni razmake/crtice, pretvori u velika slova
function cleanOznaka(oznaka) {
  return String(oznaka).replace(/[\s-]/g, '').toUpperCase();
}

// GET vozilo by oznaka
router.get('/vozilo/:oznaka', async (req, res) => {
  try {
    const oznaka = cleanOznaka(req.params.oznaka);
    const q = `SELECT marka_vozila, tip_vozila, drzavaregistracije_vozila, brojsasije_vozila, godinaproizvodnje_vozilo
               FROM vozilo WHERE REPLACE(REPLACE(UPPER(registarskaoznaka_vozila),'-',''),' ','') = $1`;
    const { rows } = await pool.query(q, [oznaka]);
    if (!rows.length) return res.status(404).json({ msg: 'Nije pronađeno vozilo' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Greška na serveru" });
  }
});

// PATCH kilometraža
router.patch('/vozilo/:oznaka', async (req, res) => {
  try {
    const { kilometraza_vozila } = req.body;
    const oznaka = cleanOznaka(req.params.oznaka);
    await pool.query(
      `UPDATE vozilo SET kilometraza_vozila = $1 WHERE REPLACE(REPLACE(UPPER(registarskaoznaka_vozila),'-',''),' ','') = $2`,
      [kilometraza_vozila, oznaka]
    );
    res.json({ msg: 'Kilometraža ažurirana' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Greška pri ažuriranju kilometraže" });
  }
});

module.exports = router;
