const asyncHandler = require('../../middleware/asyncHandler');
const service = require('./beneficiary.service');

const listBeneficiaries = asyncHandler(async (req, res) => {
  const beneficiaries = await service.listBeneficiaries(req.user);
  res.json({ success: true, data: beneficiaries });
});

const getBeneficiary = asyncHandler(async (req, res) => {
  const beneficiary = await service.getBeneficiaryById(Number(req.params.id), req.user);
  res.json({ success: true, data: beneficiary });
});

const createBeneficiary = asyncHandler(async (req, res) => {
  const beneficiary = await service.createBeneficiary(req.body, req.user);
  res.status(201).json({ success: true, data: beneficiary.beneficiary });
});

const updateBeneficiary = asyncHandler(async (req, res) => {
  const beneficiary = await service.updateBeneficiary(Number(req.params.id), req.body, req.user);
  res.json({ success: true, data: beneficiary });
});

module.exports = { listBeneficiaries, getBeneficiary, createBeneficiary, updateBeneficiary };

