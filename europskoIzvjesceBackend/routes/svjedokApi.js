const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Postavi konekcijske podatke prema tvojoj bazi
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'diplomski',
  port: 5432,
});

// POST ruta za unos svjedoka
router.post('/svjedok', async (req, res) => {
  const {
    id_nesrece,
    ime_prezime_svjedok = [],
    adresa_svjedok = [],
    kontakt_svjedok = [],
  } = req.body;

  if (!id_nesrece) {
    return res.status(400).json({ error: 'ID nesrece je obavezan.' });
  }

  try {
    // Insert ili update možeš prilagoditi
    const queryText = `
      INSERT INTO public.svjedok ("ID_svjedok", ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok, id_nesrece)
      VALUES (DEFAULT, $1, $2, $3, $4)
      RETURNING *;
    `;

    // Očekuješ da ime_prezime_svjedok, adresa_svjedok, kontakt_svjedok budu nizovi (array)
    const result = await pool.query(queryText, [
      ime_prezime_svjedok,
      adresa_svjedok,
      kontakt_svjedok,
      id_nesrece,
    ]);

    res.json({ success: true, svjedok: result.rows[0] });
  } catch (error) {
    console.error('Greška kod upisa svjedoka:', error);
    res.status(500).json({ error: 'Greška kod upisa svjedoka' });
  }
});

module.exports = router;
