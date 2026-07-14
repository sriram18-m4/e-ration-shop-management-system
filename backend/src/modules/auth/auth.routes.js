const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const controller = require('./auth.controller');
const { loginRules, registerRules } = require('./auth.validation');

const router = express.Router();

router.post('/login', validate(loginRules), controller.login);
router.post('/register', validate(registerRules), controller.register);
router.get('/me', authenticate, controller.me);

module.exports = router;

