const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const https = require('https');
const fs = require('fs');
const { Server } = require('socket.io');
const { apiKeyAuth, createPrijava } = require('./controllers/prijavaController');
require('dotenv').config();

// Import routera
const addressesRouter = require('./routes/addressApi');
const svjedokRouter = require('./routes/svjedokApi');
const osiguranjeApi = require('./routes/osiguranjeApi');
const voziloRouter = require('./routes/voziloApi');
const unosPrijaveBaza = require('./routes/unosPrijaveBaza');
const bankaRouter = require('./routes/bankaRouter');
const PDFApi = require('./routes/PDFApi');

// --- KONFIG ---
const app = express();
const PORT = process.env.SERVERPORT || 3001;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// SSL certifikat/key
const key = fs.readFileSync(path.join(__dirname, 'localhost+3-key.pem'));
const cert = fs.readFileSync(path.join(__dirname, 'localhost+3.pem'));
const options = { key, cert };

// --- CORS konfiguracija ---
app.use(cors({
  origin: [
    "https://localhost:5173",
    "https://192.168.1.246:5173"
  ],
  allowedHeaders: ['x-api-key', 'Content-Type', 'Authorization'],
  exposedHeaders: ['x-api-key']
}));

// Parsiraj body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GOOGLE API proxy
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

// GLAVNI API
app.post("/api/create-prijava", apiKeyAuth, createPrijava);

// Routeri
app.use('/api/address', apiKeyAuth, addressesRouter);
app.use('/api/svjedok', apiKeyAuth, svjedokRouter);
app.use('/api/osiguranje', apiKeyAuth, osiguranjeApi);
app.use('/api', apiKeyAuth, voziloRouter);
app.use('/api/prijava', apiKeyAuth, unosPrijaveBaza);
app.use('/api/banka', apiKeyAuth, bankaRouter);
app.use('/api', apiKeyAuth, PDFApi);

// Staticni sadrzaj
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Ruta nije pronađena." });
});

// --- SOCKET.IO na HTTPS ---
const server = https.createServer(options, app);
const io = new Server(server, { cors: { origin: "*" } });

// --- SESSION STATE ---
const sessions = {};

io.on('connection', (socket) => {
  console.log("Socket connected:", socket.id);

  // DEBUG log
  socket.onAny((event, ...args) => {
    console.log('SOCKET EVENT:', event, JSON.stringify(args, null, 2));
  });

  socket.on('join-session', ({ sessionId }) => {
    // Iniciraj session ili update role (A/B)
    if (!sessions[sessionId]) sessions[sessionId] = {};

    // Dodjela role: prvo A, onda B
    let role = !sessions[sessionId].A ? 'A' : !sessions[sessionId].B ? 'B' : null;
    if (!role) {
      // Već oba sudionika, samo ga joinaj radi statusa i sync-a
      socket.join(sessionId);
      socket.emit('role-assigned', { role: null });
      return;
    }

    // Setup role state
    sessions[sessionId][role] = {
      socketId: socket.id,
      confirmed: false,
      completed: false,
      data: {}
    };

    socket.join(sessionId);
    socket.emit('role-assigned', { role });

    // Peer sync
    if (role === 'B') {
      socket.to(sessionId).emit('peer-joined');
    }
    if (role === 'A' && sessions[sessionId].B) {
      socket.emit('peer-joined'); // Sync A kad ima B
    }

    // Emit status odmah
    io.to(sessionId).emit('peer-status-update', sessions[sessionId]);

    // Handler kad korisnik potvrdi unos
    socket.on('form-completed', (formData) => {
      sessions[sessionId][role].completed = true;
      sessions[sessionId][role].data = formData;

      // Provjeri oba completed i emitiraj status
      if (sessions[sessionId].A?.completed && sessions[sessionId].B?.completed) {
        io.to(sessionId).emit('pdf-confirmation-ready');
      }
      io.to(sessionId).emit('peer-status-update', sessions[sessionId]);
    });

    // Handler kad korisnik potvrdi i želi PDF poslati
    socket.on('confirm-send-pdf', () => {
      sessions[sessionId][role].confirmed = true;
      io.to(sessionId).emit('peer-status-update', sessions[sessionId]);

      // Final potvrda
      if (sessions[sessionId].A?.confirmed && sessions[sessionId].B?.confirmed) {
        io.to(sessionId).emit('pdf-sent');
        delete sessions[sessionId];
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      if (sessions[sessionId]) {
        if (sessions[sessionId][role]) delete sessions[sessionId][role];
        if (!sessions[sessionId].A && !sessions[sessionId].B) {
          delete sessions[sessionId];
        }
        io.to(sessionId).emit('peer-status-update', sessions[sessionId]);
      }
    });
  });
});

// ----->>> SLUŠAJ NA SVIM INTERFACIMA!
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Express + Socket.IO server listening on port ${PORT}`);
});
