const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ISPRAVNO: Importaj routere
const addressesRouter = require('./routes/addressApi');
const svjedokRouter = require('./routes/svjedokApi');
const osiguranjeApi = require('./routes/osiguranjeApi');
const voziloRouter = require('./routes/voziloApi');
const unosPrijaveBaza = require('./routes/unosPrijaveBaza');
const bankaRouter = require('./routes/bankaRouter');


const app = express();
const PORT = process.env.SERVERPORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API rute
app.use('/api/address', addressesRouter);
app.use('/api/svjedok', svjedokRouter);
app.use('/api/osiguranje', osiguranjeApi);
app.use('/api/vozilo', voziloRouter);
app.use('/api/prijava', unosPrijaveBaza);
app.use('/api/banka', bankaRouter);

// Staticki sadrzaj
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 fallback (za nepostojece rute)
app.use((req, res) => {
  res.status(404).json({ error: "Ruta nije pronađena." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
