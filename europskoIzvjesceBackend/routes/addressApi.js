// routes/addressApi.js
const express = require('express');
const fetch = require('cross-fetch'); // npm install cross-fetch

const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // mora biti postavljeno u .env

router.get('/', async (req, res) => {
  const query = req.query.q || '';
  if (!query || query.length < 2) return res.json([]);
  if (!GOOGLE_API_KEY) {
    console.error('Google API ključ nije postavljen!');
    return res.status(500).json({ error: 'Google API ključ nije postavljen' });
  }

  const params = new URLSearchParams({
    input: query,
    key: GOOGLE_API_KEY,
    components: 'country:hr',
    types: 'address'
  });

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;

  try {
    console.log('SLANJE Google Places API:', url);
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return res.status(500).json({
        error: 'Google Places API error',
        status: data.status,
        error_message: data.error_message
      });
    }

    const results = data.predictions.map(p => ({
      id: p.place_id,
      formatted: p.description
    }));

    return res.json(results);
  } catch (error) {
    console.error('Fetch exception:', error);
    res.status(500).json({ error: 'Error fetching Google Places', details: error.message });
  }
});

module.exports = router;
