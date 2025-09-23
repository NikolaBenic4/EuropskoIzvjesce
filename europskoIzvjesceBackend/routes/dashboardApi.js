const express = require('express');
const { 
  authenticateToken,
  getZahtjevi,
  getZahtjev,
  updateSteta,
  closeZahtjev
} = require('../controllers/dashboardController');

const router = express.Router();

// Sve rute zahtijevaju autentifikaciju
router.use(authenticateToken);

router.get('/zahtjevi', getZahtjevi);
router.get('/zahtjev/:id', getZahtjev);
router.put('/zahtjev/:id/steta', updateSteta);
router.put('/zahtjev/:id/close', closeZahtjev);

module.exports = router;