const { body, param } = require('express-validator');

const createBeneficiaryRules = [
  body('fullName').trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }),
  body('password').optional().isLength({ min: 8 }),
  body('shopId').optional({ nullable: true }).isInt({ min: 1 }),
  body('rationCardNumber').trim().isLength({ min: 4, max: 32 }),
  body('aadhaarLast4').optional({ checkFalsy: true }).isLength({ min: 4, max: 4 }),
  body('familySize').optional().isInt({ min: 1, max: 30 }),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('incomeCategory').optional({ checkFalsy: true }).trim().isLength({ max: 60 }),
  body('monthlyEntitlementKg').optional().isFloat({ min: 0 })
];

const updateBeneficiaryRules = [
  param('id').isInt({ min: 1 }),
  body('fullName').optional().trim().isLength({ min: 2, max: 120 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }),
  body('shopId').optional({ nullable: true }).isInt({ min: 1 }),
  body('rationCardNumber').optional().trim().isLength({ min: 4, max: 32 }),
  body('aadhaarLast4').optional({ checkFalsy: true }).isLength({ min: 4, max: 4 }),
  body('familySize').optional().isInt({ min: 1, max: 30 }),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('incomeCategory').optional({ checkFalsy: true }).trim().isLength({ max: 60 }),
  body('monthlyEntitlementKg').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive'])
];

const idParamRules = [param('id').isInt({ min: 1 })];

module.exports = { createBeneficiaryRules, updateBeneficiaryRules, idParamRules };

