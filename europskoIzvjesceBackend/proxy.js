// server/proxy.js
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PROXY_PORT || 5001; // biraj port koji nije zauzet
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Omogući CORS za tvoj frontend
app.use(require("cors")({
  origin: "http://localhost:5173" // promijeni na svoj frontend
}));

// Autocomplete endpoint
app.get("/api/google-autocomplete", async (req, res) => {
  const { input } = req.query;
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&language=hr&components=country:hr`;
  const googleRes = await fetch(url);
  const data = await googleRes.json();
  res.json(data);
});

// Details endpoint
app.get("/api/google-details", async (req, res) => {
  const { place_id } = req.query;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${GOOGLE_API_KEY}&language=hr`;
  const googleRes = await fetch(url);
  const data = await googleRes.json();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Backend proxy radi na portu ${PORT}`);
});
