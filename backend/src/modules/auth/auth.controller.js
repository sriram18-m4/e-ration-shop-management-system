const asyncHandler = require('../../middleware/asyncHandler');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.json({ success: true, data: result });
});

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerBeneficiary(req.body);
  res.status(201).json({ success: true, data: result });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = { login, register, me };

