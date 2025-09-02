import db from '../db.js'; // tvoj modul za konekciju

export async function getAll(req, res) {
  try {
    const result = await db.query('SELECT * FROM nesreca ORDER BY datum_nesrece DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching nesreca records.' });
  }
}

export async function create(req, res) {
  try {
    const {
      datum_nesrece,
      vrijeme_nesrece,
      mjesto_nesrece,
      geolokacija_nesrece,
      ozlijedeneosobe,
      stetanavozila,
      stetanastvarima
    } = req.body;

    const query = `
      INSERT INTO nesreca (
        datum_nesrece,
        vrijeme_nesrece,
        mjesto_nesrece,
        geolokacija_nesrece,
        ozlijedeneosobe,
        stetanavozilima,
        stetanastvarima
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_nesrece
    `;

    const values = [
      datum_nesrece,
      vrijeme_nesrece,
      mjesto_nesrece,
      geolokacija_nesrece || null,
      ozlijedeneosobe,
      stetanavozila,
      stetanastvarima
    ];

    const result = await db.query(query, values);
    res.status(201).json({ message: 'Nesreca zapis kreiran', id: result.rows[0].id_nesrece });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška pri spremanju nesreće' });
  }
}
