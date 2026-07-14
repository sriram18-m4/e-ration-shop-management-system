const { body } = require('express-validator');

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
];

const registerRules = [
  body('fullName').trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 20 }),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('rationCardNumber').trim().isLength({ min: 4, max: 32 }),
  body('aadhaarLast4').optional({ checkFalsy: true }).isLength({ min: 4, max: 4 }),
  body('familySize').optional().isInt({ min: 1, max: 30 }),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('shopId').optional({ nullable: true }).isInt({ min: 1 })
];

module.exports = { loginRules, registerRules };

