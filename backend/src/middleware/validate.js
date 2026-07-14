const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

module.exports = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError(422, 'Validation failed.', errors.array()));
    }
    return next();
  }
];

