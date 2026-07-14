const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { query } = require('../../config/db');
const ROLES = require('../../constants/roles');
const ApiError = require('../../utils/apiError');
const { createBeneficiary } = require('../beneficiaries/beneficiary.service');

function publicUser(row) {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    shopId: row.shopId,
    rationCardNumber: row.rationCardNumber,
    status: row.status
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

async function login(email, password) {
  const users = await query(
    `SELECT id, full_name AS fullName, email, phone, role, shop_id AS shopId,
      ration_card_number AS rationCardNumber, password_hash AS passwordHash, status
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  if (!users.length || users[0].status !== 'active') {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isValid = await bcrypt.compare(password, users[0].passwordHash);
  if (!isValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const user = publicUser(users[0]);
  return { token: signToken(user), user };
}

async function registerBeneficiary(payload) {
  const beneficiary = await createBeneficiary({
    ...payload,
    role: ROLES.BENEFICIARY,
    status: 'active'
  });

  return {
    token: signToken(beneficiary.user),
    user: beneficiary.user
  };
}

module.exports = { login, registerBeneficiary, publicUser, signToken };

