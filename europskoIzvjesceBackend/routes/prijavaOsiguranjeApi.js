// routes/prijavaOsiguranjeApi.js
const express = require('express');
const { login, verifyTwoFactor } = require('../controllers/prijavaOsiguranje');
const router = express.Router();

router.post('/login', login);
router.post('/verify-2fa', verifyTwoFactor);

module.exports = router;
