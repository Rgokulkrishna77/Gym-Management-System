const asyncHandler = require('../utils/asyncHandler');
const statsModel = require('../models/statsModel');

exports.dashboard = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await statsModel.dashboard() });
});
