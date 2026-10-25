const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const workoutModel = require('../models/workoutModel');

const checkDates = (d) => {
  if (d.endDate < d.startDate) {
    throw new AppError(400, 'Validation failed', [{ field: 'endDate', message: 'endDate must be on or after startDate' }]);
  }
};

// Trainer/admin: all plans for one member (?memberId=)
exports.listForMember = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await workoutModel.listForMember(req.query.memberId) });
});

// Member: own plans
exports.mine = asyncHandler(async (req, res) => {
  if (!req.user.memberId) throw new AppError(403, 'No member profile for this account');
  res.json({ success: true, data: await workoutModel.listForMember(req.user.memberId) });
});

exports.create = asyncHandler(async (req, res) => {
  checkDates(req.body);
  const id = await workoutModel.create(req.body, req.user.trainerId);
  res.status(201).json({ success: true, message: 'Workout plan saved', data: { workoutId: id } });
});

exports.update = asyncHandler(async (req, res) => {
  checkDates(req.body);
  await workoutModel.update(req.params.id, req.body, req.user.trainerId);
  res.json({ success: true, message: 'Workout plan updated' });
});
