const asyncHandler = require('../../middleware/asyncHandler');
const service = require('./shop.service');

const listShops = asyncHandler(async (req, res) => {
  const shops = await service.listShops(req.user);
  res.json({ success: true, data: shops });
});

const createShop = asyncHandler(async (req, res) => {
  const shop = await service.createShop(req.body);
  res.status(201).json({ success: true, data: shop });
});

const updateShop = asyncHandler(async (req, res) => {
  const shop = await service.updateShop(Number(req.params.id), req.body);
  res.json({ success: true, data: shop });
});

module.exports = { listShops, createShop, updateShop };

