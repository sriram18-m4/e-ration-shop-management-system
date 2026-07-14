const asyncHandler = require('../../middleware/asyncHandler');
const service = require('./stock.service');

const listItems = asyncHandler(async (req, res) => {
  const items = await service.listItems();
  res.json({ success: true, data: items });
});

const createItem = asyncHandler(async (req, res) => {
  const item = await service.createItem(req.body);
  res.status(201).json({ success: true, data: item });
});

const listStock = asyncHandler(async (req, res) => {
  const stock = await service.listStock(req.user, req.query.shopId ? Number(req.query.shopId) : null);
  res.json({ success: true, data: stock });
});

const upsertStock = asyncHandler(async (req, res) => {
  const stock = await service.upsertStock(req.body, req.user);
  res.status(201).json({ success: true, data: stock });
});

const updateStock = asyncHandler(async (req, res) => {
  const stock = await service.updateStock(Number(req.params.id), req.body, req.user);
  res.json({ success: true, data: stock });
});

module.exports = { listItems, createItem, listStock, upsertStock, updateStock };

