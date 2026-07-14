const asyncHandler = require('../../middleware/asyncHandler');
const service = require('./chat.service');

const ask = asyncHandler(async (req, res) => {
  const response = await service.askChatbot(req.body.message, req.user, req.body.history || []);
  res.json({ success: true, data: response });
});

module.exports = { ask };

