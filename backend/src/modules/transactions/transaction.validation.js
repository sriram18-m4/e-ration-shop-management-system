const { body, param } = require('express-validator');

const createTransactionRules = [
  body('beneficiaryId').isInt({ min: 1 }),
  body('shopId').optional({ nullable: true }).isInt({ min: 1 }),
  body('remarks').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  body('items').isArray({ min: 1 }),
  body('items.*.itemId').isInt({ min: 1 }),
  body('items.*.quantity').isFloat({ gt: 0 })
];

const idParamRules = [param('id').isInt({ min: 1 })];

module.exports = { createTransactionRules, idParamRules };

