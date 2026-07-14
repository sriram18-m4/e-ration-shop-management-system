const { body } = require('express-validator');

const chatRules = [
  body('message').trim().isLength({ min: 2, max: 800 }).withMessage('Message must be between 2 and 800 characters.'),
  body('history').optional().isArray({ max: 10 }),
  body('history.*.role').optional().isIn(['user', 'assistant']),
  body('history.*.content').optional().trim().isLength({ min: 1, max: 800 })
];

module.exports = { chatRules };

