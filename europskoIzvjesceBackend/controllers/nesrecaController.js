import pool from '../db.js';

// Dohvati sve nezgode
export async function getAll(req, res) {
  try {
    const result = await pool.query('SELECT * FROM nesreca ORDER BY datum_nesrece DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Dodaj novu nezgodu
export async function create(req, res) {
  const { datum_nesrece, vrijeme_nesrece, mjesto_nesrece, ozlijedeneososbe, stetanavozilima, stetanastvarima } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO nesreca (datum_nesrece, vrijeme_nesrece, mjesto_nesrece, ozlijedeneososbe, stetanavozilima, stetanastvarima)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [datum_nesrece, vrijeme_nesrece, mjesto_nesrece, ozlijedeneososbe, stetanavozilima, stetanastvarima]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
