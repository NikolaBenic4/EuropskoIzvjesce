const express = require('express');
const { getZahtjevi } = require('../controllers/zahtjeviController');
const router = express.Router();

router.get('/prijava-zahtjevi', getZahtjevi);

module.exports = router;
