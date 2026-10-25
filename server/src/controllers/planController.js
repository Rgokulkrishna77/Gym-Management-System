const asyncHandler = require('../utils/asyncHandler');
const planModel = require('../models/planModel');

exports.list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await planModel.list() });
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Plan created', data: await planModel.create(req.body) });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Plan updated', data: await planModel.update(req.params.id, req.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  await planModel.remove(req.params.id);
  res.json({ success: true, message: 'Plan deleted' });
});
