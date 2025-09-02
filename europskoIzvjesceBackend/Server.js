const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Prvo učitaj router za adrese:
const addressesRouter = require('./routes/addressApi'); // <-- naziv isti kao u modulu/ruti
const svjedokRouter = require('./routes/svjedokApi');
const osiguranjeApi = require('./routes/osiguranjeApi');
const nesrecaApi = require('./routes/nesrecaApi');
const voziloRouter = require('./routes/voziloApi');


const app = express();
const PORT = process.env.SERVERPORT || 3000 ;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// RUTE API-a uvijeK dolaze PRIJE statičkog servinga!
app.use('/api', addressesRouter);
app.use('/api', svjedokRouter);
app.use('/api', osiguranjeApi);
app.use('/api', voziloRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
