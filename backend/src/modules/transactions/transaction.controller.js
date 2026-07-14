const asyncHandler = require('../../middleware/asyncHandler');
const service = require('./transaction.service');

const listTransactions = asyncHandler(async (req, res) => {
  const transactions = await service.listTransactions(req.user);
  res.json({ success: true, data: transactions });
});

const getTransaction = asyncHandler(async (req, res) => {
  const rationTransaction = await service.getTransactionById(Number(req.params.id), req.user);
  res.json({ success: true, data: rationTransaction });
});

const createTransaction = asyncHandler(async (req, res) => {
  const rationTransaction = await service.createTransaction(req.body, req.user);
  res.status(201).json({ success: true, data: rationTransaction });
});

module.exports = { listTransactions, getTransaction, createTransaction };

