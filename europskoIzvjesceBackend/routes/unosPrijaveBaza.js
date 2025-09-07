const express = require('express');
const router = express.Router();
const prijavaController = require('../controllers/prijavaController');

router.post('/', prijavaController.createPrijava);

module.exports = router;
