const express = require('express');
const fetch = require('cross-fetch');

const router = express.Router();

// Učitaj API ključ
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

router.get('/addresses', async (req, res) => {
  const query = req.query.q || '';
  if (!query || query.length < 2) {
    return res.json([]);
  }

  const params = new URLSearchParams({
    input: query,
    key: GOOGLE_API_KEY,
    components: 'country:hr',
    types: 'address' // možeš probati i bez ove linije radi više rezultata
  });

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;

  try {
    console.log('SLANJE Google Places API:', url);

    const response = await fetch(url);
    const data = await response.json();

    console.log('Google Places API odgovor:', data);

    if (data.status !== 'OK') {
      // ISPIS error_message iz Google API-a!
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

    res.json(results);
  } catch (error) {
    console.error('Fetch exception:', error);
    res.status(500).json({ error: 'Error fetching Google Places', details: error.message });
  }
});

module.exports = router;
