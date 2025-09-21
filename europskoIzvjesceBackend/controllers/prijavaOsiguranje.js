const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const secret = process.env.JWT_SECRET || 'tajni_kljuc';

// Kreiraj Pool konekciju prema bazi (promijeni parametre po potrebi)
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

async function login(req, res) {
  let { username, password } = req.body;
  username = username.trim();
  password = password.trim();

  try {
    // Dohvaćanje podataka po naziv_osiguranja (korisnicko ime)
    const query = 'SELECT id_osiguranje, naziv_osiguranja FROM osiguranje WHERE naziv_osiguranja = $1';
    const { rows } = await pool.query(query, [username]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Neispravno korisničko ime' });
    }

    const osiguranje = rows[0];
    const expectedPassword = String(osiguranje.id_osiguranje) + osiguranje.naziv_osiguranja;

    if (password !== expectedPassword) {
      return res.status(401).json({ error: 'Neispravna lozinka' });
    }

    const tokenPayload = {
      username,
      id_osiguranje: osiguranje.id_osiguranje,
    };

    const token = jwt.sign(tokenPayload, secret, { expiresIn: '1h' });

    res.json({
      requiresTwoFactor: true,
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Greška na serveru' });
  }
}


async function verifyTwoFactor(req, res) {
  const { code } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: 'Nema tokena' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    // Primjer provjere dvofaktorske autentifikacije (hardkodirani kod)
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
