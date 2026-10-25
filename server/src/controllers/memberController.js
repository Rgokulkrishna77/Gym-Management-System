const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const memberModel = require('../models/memberModel');

exports.list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await memberModel.list() });
});

exports.getOne = asyncHandler(async (req, res) => {
  const member = await memberModel.findById(req.params.id);
  if (!member) throw new AppError(404, 'Member not found');
  res.json({ success: true, data: member });
});

// Logged-in member's own dashboard
exports.myDashboard = asyncHandler(async (req, res) => {
  if (!req.user.memberId) throw new AppError(403, 'No member profile for this account');
  res.json({ success: true, data: await memberModel.dashboard(req.user.memberId) });
});

// Receptionist/admin registers a member and records the payment as PAID
exports.create = asyncHandler(async (req, res) => {
  const { paymentMethod, ...data } = req.body;
  const result = await memberModel.create(data, { paymentMethod, paymentStatus: 'paid' });
  res.status(201).json({
    success: true,
    message: `Member registered. Member ID: ${result.memberCode}`,
    data: result,
  });
});

exports.update = asyncHandler(async (req, res) => {
  await memberModel.update(req.params.id, req.body);
  res.json({ success: true, message: 'Member updated', data: await memberModel.findById(req.params.id) });
});

exports.remove = asyncHandler(async (req, res) => {
  await memberModel.remove(req.params.id);
  res.json({ success: true, message: 'Member deleted' });
});
