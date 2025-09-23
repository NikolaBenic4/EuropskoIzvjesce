// routes/model3DApi.js

const express = require('express');
const { generate3DModel } = require('../controllers/model3DController');
const { authenticateToken } = require('../controllers/dashboardController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/3d/ -> generate 3D model from images
router.post('/', generate3DModel);

module.exports = router;
