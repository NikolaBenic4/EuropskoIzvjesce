const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

// Konfiguracija za email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getEmails = async (req, res) => {
  try {
    const { id_osiguranje } = req.user;
    
    const query = `
      SELECT * FROM emails 
      WHERE id_osiguranje = $1 
      ORDER BY date DESC
    `;
    
    const { rows } = await pool.query(query, [id_osiguranje]);
    res.json(rows);
  } catch (error) {
    console.error('Greška pri dohvaćanju emailova:', error);
    res.status(500).json({ error: 'Greška na serveru' });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const { id_osiguranje } = req.user;

    // Pošalji email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      text: body,
    };

    await transporter.sendMail(mailOptions);

    // Spremi u bazu
    const query = `
      INSERT INTO emails (id_osiguranje, from_email, to_email, subject, body, date, type)
      VALUES ($1, $2, $3, $4, $5, NOW(), 'sent')
    `;

    await pool.query(query, [
      id_osiguranje,
      process.env.SMTP_USER,
      to,
      subject,
      body
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Greška pri slanju emaila:', error);
    res.status(500).json({ error: 'Greška pri slanju emaila' });
  }
};

module.exports = { getEmails, sendEmail };