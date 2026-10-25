const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const membershipModel = require('../models/membershipModel');

exports.listExpired = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await membershipModel.listExpired() });
});

exports.renew = asyncHandler(async (req, res) => {
  const result = await membershipModel.renew(req.body);
  res.status(201).json({
    success: true,
    message: `Membership renewed until ${result.expiryDate}`,
    data: result,
  });
});

exports.listPendingPayments = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await membershipModel.listPendingPayments() });
});

exports.markPaid = asyncHandler(async (req, res) => {
  const ok = await membershipModel.markPaid(req.params.id, req.body.method);
  if (!ok) throw new AppError(404, 'Pending payment not found');
  res.json({ success: true, message: 'Payment recorded as paid' });
});
