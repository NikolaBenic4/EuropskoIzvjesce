const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const { apiKeyAuth, createPrijava } = require('./controllers/prijavaController');
require('dotenv').config();

// Import tvojih lokalnih routera
const addressesRouter = require('./routes/addressApi');
const svjedokRouter = require('./routes/svjedokApi');
const osiguranjeApi = require('./routes/osiguranjeApi');
const voziloRouter = require('./routes/voziloApi');
const unosPrijaveBaza = require('./routes/unosPrijaveBaza');
const bankaRouter = require('./routes/bankaRouter');

const app = express();
const PORT = process.env.SERVERPORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Middlewares
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- EXTERNAL GOOGLE API PROXY ROUTES --- //
app.get("/api/google-autocomplete", async (req, res) => {
  const { input } = req.query;
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&language=hr&components=country:hr`;
  const googleRes = await fetch(url);
  const data = await googleRes.json();
  res.json(data);
});

app.get("/api/google-details", async (req, res) => {
  const { place_id } = req.query;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${GOOGLE_API_KEY}&language=hr`;
  const googleRes = await fetch(url);
  const data = await googleRes.json();
  res.json(data);
});

app.post("/api/prijava", apiKeyAuth, createPrijava);

// --- INTERNAL API ROUTES --- //
app.use('/api/address', addressesRouter);
app.use('/api/svjedok', svjedokRouter);
app.use('/api/osiguranje', osiguranjeApi);
app.use('/api', voziloRouter);
app.use('/api/prijava', unosPrijaveBaza);
app.use('/api/banka', bankaRouter);

// Staticki sadrzaj
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback za 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta nije pronađena." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
