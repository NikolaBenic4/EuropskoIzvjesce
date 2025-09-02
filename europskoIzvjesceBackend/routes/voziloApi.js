const express = require('express');
const router = express.Router();
const pool = require('../db'); // pool je tvoje db povezivanje

// GET vozilo by registarskaoznaka
router.get('/vozilo/:oznaka', async (req, res) => {
  const oznaka = req.params.oznaka;
  const q = `SELECT marka_vozila, tip_vozila, drzavaregistracije_vozila, brojsasije_vozila, godinaproizvodnje_vozilo
             FROM vozilo WHERE registarskaoznaka_vozila = $1`;
  const { rows } = await pool.query(q, [oznaka]);
  if (rows.length === 0) return res.status(404).json({ msg: 'Nije pronađeno vozilo' });
  res.json(rows[0]);
});

// PATCH kilometraža
router.patch('/vozilo/:oznaka', async (req, res) => {
  const { kilometraza_vozila } = req.body;
  const oznaka = req.params.oznaka;
  await pool.query(
    'UPDATE vozilo SET kilometraza_vozila = $1 WHERE registarskaoznaka_vozila = $2',
    [kilometraza_vozila, oznaka]
  );
  res.json({ msg: 'Kilometraža ažurirana' });
});

module.exports = router;
