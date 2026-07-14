const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const ApiError = require('../utils/apiError');
const asyncHandler = require('./asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication token is required.');
  }

  const payload = jwt.verify(token, env.jwtSecret);
  const users = await query(
    `SELECT id, full_name AS fullName, email, phone, role, shop_id AS shopId,
      ration_card_number AS rationCardNumber, status
     FROM users
     WHERE id = ? AND status = 'active'
     LIMIT 1`,
    [payload.sub]
  );

  if (!users.length) {
    throw new ApiError(401, 'User is inactive or no longer exists.');
  }

  req.user = users[0];
  next();
});

