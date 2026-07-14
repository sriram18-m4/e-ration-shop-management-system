const express = require('express');
const authenticate = require('../../middleware/authenticate');
const controller = require('./dashboard.controller');

const router = express.Router();

router.use(authenticate);
router.get('/summary', controller.summary);

module.exports = router;

