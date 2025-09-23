const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const secret = process.env.JWT_SECRET || 'tajni_kljuc';

// Kreiraj Pool konekciju prema bazi
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

async function login(req, res) {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nedostaju username ili password' });
  }
  username = username.trim();

  try {
    // Dohvati red iz osiguranje po naziv_osiguranja
    const { rows } = await pool.query(
      'SELECT id_osiguranje, naziv_osiguranja FROM osiguranje WHERE naziv_osiguranja = $1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Neispravno korisničko ime' });
    }

    const { id_osiguranje, naziv_osiguranja } = rows[0];

    // Očekivana lozinka: id_osiguranje + naziv_osiguranja
    const expectedPassword = `${id_osiguranje}${naziv_osiguranja}`;
    if (password !== expectedPassword) {
      return res.status(401).json({ error: 'Neispravna lozinka' });
    }

    // Generiraj JWT
    const token = jwt.sign(
      { username, id_osiguranje },
      secret,
      { expiresIn: '1h' }
    );

    return res.json({
      requiresTwoFactor: true,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Greška na serveru' });
  }
}

async function verifyTwoFactor(req, res) {
  const { code } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Nema tokena' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, secret);
    // Hardkodirani 2FA kod
    if (code === '123456') {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ error: 'Neispravan 2FA kod' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Nevažeći token' });
  }
}

module.exports = { login, verifyTwoFactor };
