const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const { apiKeyAuth, createPrijava } = require('./controllers/prijavaController');
const addressesRouter = require('./routes/addressApi');
const svjedokRouter = require('./routes/svjedokApi');
const osiguranjeApi = require('./routes/osiguranjeApi');
const voziloRouter = require('./routes/voziloApi');
const unosPrijaveBaza = require('./routes/unosPrijaveBaza');
const bankaRouter = require('./routes/bankaRouter');
const PDFApi = require('./routes/PDFApi');

const initializeSocket = require('./Socket'); // Uvezi funkciju

const app = express();
const PORT = process.env.SERVERPORT || 3001;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const key = fs.readFileSync(path.join(__dirname, 'localhost+3-key.pem'));
const cert = fs.readFileSync(path.join(__dirname, 'localhost+3.pem'));
const options = { key, cert };

app.use(cors({
  origin: [
    "https://localhost:5173",
    "https://192.168.1.246:5173"
  ],
  allowedHeaders: ['x-api-key', 'Content-Type', 'Authorization'],
  exposedHeaders: ['x-api-key']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/google-autocomplete", async (req, res) => {
  const { input } = req.query;
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&language=hr&components=country:hr`;
  const googleRes = await fetch(url);
  res.json(await googleRes.json());
});

app.get("/api/google-details", async (req, res) => {
  const { place_id } = req.query;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${GOOGLE_API_KEY}&language=hr`;
  const googleRes = await fetch(url);
  res.json(await googleRes.json());
});

app.post("/api/create-prijava", apiKeyAuth, createPrijava);

app.use('/api/address', apiKeyAuth, addressesRouter);
app.use('/api/svjedok', apiKeyAuth, svjedokRouter);
app.use('/api/osiguranje', apiKeyAuth, osiguranjeApi);
app.use('/api', apiKeyAuth, voziloRouter);
app.use('/api/prijava', apiKeyAuth, unosPrijaveBaza);
app.use('/api/banka', apiKeyAuth, bankaRouter);
app.use('/api', apiKeyAuth, PDFApi);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta nije pronađena." });
});

const server = https.createServer(options, app);
const io = initializeSocket(server); // Pozovi funkciju

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Express + Socket.IO server listening on port ${PORT}`);
});
