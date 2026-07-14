const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const ROLES = require('../../constants/roles');
const controller = require('./transaction.controller');
const { createTransactionRules, idParamRules } = require('./transaction.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.listTransactions);
router.post('/', authorize(ROLES.SHOP_OWNER), validate(createTransactionRules), controller.createTransaction);
router.get('/:id', validate(idParamRules), controller.getTransaction);

module.exports = router;
