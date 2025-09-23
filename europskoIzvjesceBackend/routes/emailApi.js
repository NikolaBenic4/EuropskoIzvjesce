// routes/emailApi.js

const express = require('express');
const { getEmails, sendEmail } = require('../controllers/emailController');
const { authenticateToken } = require('../controllers/dashboardController');

const router = express.Router();

// All email routes require authentication
router.use(authenticateToken);

// GET /api/mail/           -> list emails for this insurance company
router.get('/', getEmails);

// POST /api/mail/send      -> send email and save record
router.post('/send', sendEmail);

module.exports = router;
