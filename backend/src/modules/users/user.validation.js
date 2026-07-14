const { body, param } = require('express-validator');
const ROLES = require('../../constants/roles');

const roleValues = Object.values(ROLES);

const createUserRules = [
  body('fullName').trim().isLength({ min: 2, max: 120 }).withMessage('Full name must be between 2 and 120 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }).withMessage('Phone number must be between 8 and 20 characters.'),
  body('password').isLength({ min: 8 }).withMessage('Password must contain at least 8 characters.'),
  body('role').isIn(roleValues).withMessage('Select a valid user role.'),
  body('shopId').optional({ nullable: true }).isInt({ min: 1 }),
  body('shopId').custom((value, { req }) => {
    if (req.body.role === ROLES.SHOP_OWNER && !value) {
      throw new Error('A shop must be assigned to a shop owner.');
    }
    return true;
  }),
  body('rationCardNumber').optional({ checkFalsy: true }).trim().isLength({ max: 32 }),
  body('aadhaarLast4').optional({ checkFalsy: true }).isLength({ min: 4, max: 4 }).withMessage('Aadhaar last 4 must contain exactly 4 characters.'),
  body('status').optional().isIn(['active', 'inactive'])
];

const updateUserRules = [
  param('id').isInt({ min: 1 }),
  body('fullName').optional().trim().isLength({ min: 2, max: 120 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }),
  body('role').optional().isIn(roleValues),
  body('shopId').optional({ nullable: true }).isInt({ min: 1 }),
  body('rationCardNumber').optional({ checkFalsy: true }).trim().isLength({ max: 32 }),
  body('aadhaarLast4').optional({ checkFalsy: true }).isLength({ min: 4, max: 4 }),
  body('status').optional().isIn(['active', 'inactive'])
];

const idParamRules = [param('id').isInt({ min: 1 })];

module.exports = { createUserRules, updateUserRules, idParamRules };
