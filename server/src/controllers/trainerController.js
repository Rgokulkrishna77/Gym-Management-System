const asyncHandler = require('../utils/asyncHandler');
const trainerModel = require('../models/trainerModel');

// Public visitors (landing page) get names/specializations only;
// logged-in staff also get email and phone.
exports.list = asyncHandler(async (req, res) => {
  const staff = req.user && ['admin', 'receptionist', 'trainer'].includes(req.user.role);
  res.json({ success: true, data: await trainerModel.list(staff) });
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Trainer created', data: await trainerModel.create(req.body) });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Trainer updated', data: await trainerModel.update(req.params.id, req.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  await trainerModel.remove(req.params.id);
  res.json({ success: true, message: 'Trainer deleted' });
});
