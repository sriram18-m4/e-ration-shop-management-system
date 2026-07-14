const { body, param, query } = require('express-validator');

const stockQueryRules = [
  query('shopId').optional().isInt({ min: 1 })
];

const createStockRules = [
  body('shopId').optional({ nullable: true }).isInt({ min: 1 }),
  body('itemId').isInt({ min: 1 }),
  body('quantity').isFloat({ min: 0 }),
  body('reorderLevel').optional().isFloat({ min: 0 }),
  body('note').optional({ checkFalsy: true }).trim().isLength({ max: 255 })
];

const updateStockRules = [
  param('id').isInt({ min: 1 }),
  body('quantity').isFloat({ min: 0 }),
  body('reorderLevel').optional().isFloat({ min: 0 }),
  body('note').optional({ checkFalsy: true }).trim().isLength({ max: 255 })
];

const createItemRules = [
  body('sku').trim().isLength({ min: 2, max: 32 }),
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('unit').trim().isLength({ min: 1, max: 20 }),
  body('monthlyQuotaPerPerson').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive'])
];

module.exports = { stockQueryRules, createStockRules, updateStockRules, createItemRules };

