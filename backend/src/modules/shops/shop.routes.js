const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const ROLES = require('../../constants/roles');
const controller = require('./shop.controller');
const { createShopRules, updateShopRules } = require('./shop.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN, ROLES.SHOP_OWNER), controller.listShops);
router.post('/', authorize(ROLES.ADMIN), validate(createShopRules), controller.createShop);
router.put('/:id', authorize(ROLES.ADMIN), validate(updateShopRules), controller.updateShop);

module.exports = router;

