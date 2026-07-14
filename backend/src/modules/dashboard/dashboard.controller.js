const asyncHandler = require('../../middleware/asyncHandler');
const service = require('./dashboard.service');

const summary = asyncHandler(async (req, res) => {
  const data = await service.getSummary(req.user);
  res.json({ success: true, data });
});

module.exports = { summary };

