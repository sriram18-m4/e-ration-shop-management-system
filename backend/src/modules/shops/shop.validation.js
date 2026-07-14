const { body, param } = require('express-validator');

const createShopRules = [
  body('code').trim().isLength({ min: 2, max: 32 }),
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('district').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body('contactPhone').optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }),
  body('status').optional().isIn(['active', 'inactive'])
];

const updateShopRules = [
  param('id').isInt({ min: 1 }),
  body('code').optional().trim().isLength({ min: 2, max: 32 }),
  body('name').optional().trim().isLength({ min: 2, max: 120 }),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('district').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body('contactPhone').optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }),
  body('status').optional().isIn(['active', 'inactive'])
];

const idParamRules = [param('id').isInt({ min: 1 })];

module.exports = { createShopRules, updateShopRules, idParamRules };
