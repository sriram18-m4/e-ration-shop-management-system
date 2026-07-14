const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const controller = require('./chat.controller');
const { chatRules } = require('./chat.validation');

const router = express.Router();

router.use(authenticate);
router.post('/', validate(chatRules), controller.ask);

module.exports = router;

