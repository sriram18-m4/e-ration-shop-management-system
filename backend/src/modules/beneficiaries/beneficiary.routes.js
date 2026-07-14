const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const ROLES = require('../../constants/roles');
const controller = require('./beneficiary.controller');
const { createBeneficiaryRules, updateBeneficiaryRules, idParamRules } = require('./beneficiary.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.listBeneficiaries);
router.get('/:id', validate(idParamRules), controller.getBeneficiary);
router.post('/', authorize(ROLES.ADMIN, ROLES.SHOP_OWNER), validate(createBeneficiaryRules), controller.createBeneficiary);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.SHOP_OWNER), validate(updateBeneficiaryRules), controller.updateBeneficiary);

module.exports = router;

