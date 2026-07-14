const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const ROLES = require('../../constants/roles');
const controller = require('./user.controller');
const { createUserRules, updateUserRules, idParamRules } = require('./user.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN, ROLES.SHOP_OWNER), controller.listUsers);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.SHOP_OWNER), validate(idParamRules), controller.getUser);
router.post('/', authorize(ROLES.ADMIN), validate(createUserRules), controller.createUser);
router.put('/:id', authorize(ROLES.ADMIN), validate(updateUserRules), controller.updateUser);
router.delete('/:id', authorize(ROLES.ADMIN), validate(idParamRules), controller.deactivateUser);

module.exports = router;

