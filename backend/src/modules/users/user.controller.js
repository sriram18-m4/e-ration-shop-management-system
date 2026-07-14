const asyncHandler = require('../../middleware/asyncHandler');
const service = require('./user.service');

const listUsers = asyncHandler(async (req, res) => {
  const users = await service.listUsers(req.query, req.user);
  res.json({ success: true, data: users });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await service.getUserById(Number(req.params.id), req.user);
  res.json({ success: true, data: user });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await service.createUser(req.body);
  res.status(201).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await service.updateUser(Number(req.params.id), req.body);
  res.json({ success: true, data: user });
});

const deactivateUser = asyncHandler(async (req, res) => {
  await service.deactivateUser(Number(req.params.id));
  res.status(204).send();
});

module.exports = { listUsers, getUser, createUser, updateUser, deactivateUser };

