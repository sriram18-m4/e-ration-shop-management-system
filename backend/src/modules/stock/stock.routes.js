const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const ROLES = require('../../constants/roles');
const controller = require('./stock.controller');
const { stockQueryRules, createStockRules, updateStockRules, createItemRules } = require('./stock.validation');

const router = express.Router();

router.use(authenticate);

router.get('/items', controller.listItems);
router.post('/items', authorize(ROLES.ADMIN), validate(createItemRules), controller.createItem);
router.get('/', validate(stockQueryRules), controller.listStock);
router.post('/', authorize(ROLES.SHOP_OWNER), validate(createStockRules), controller.upsertStock);
router.put('/:id', authorize(ROLES.SHOP_OWNER), validate(updateStockRules), controller.updateStock);

module.exports = router;
