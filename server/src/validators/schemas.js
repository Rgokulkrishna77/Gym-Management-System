const Joi = require('joi');

const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({ 'string.pattern.base': '{#label} must be a date (YYYY-MM-DD)' });
const phone = Joi.string().pattern(/^[0-9+ -]{7,15}$/).required().messages({ 'string.pattern.base': 'phone must be 7-15 digits' });
const password = Joi.string().min(8).max(72);

exports.login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Public self-registration and receptionist/admin registration share the same fields
const memberFields = {
  name: Joi.string().trim().min(2).max(100).required(),
  phone,
  email: Joi.string().trim().email().max(150).required(),
  address: Joi.string().trim().min(3).max(255).required(),
  age: Joi.number().integer().min(12).max(100).required(),
  planId: Joi.number().integer().positive().required(),
  password: password.required(),
};
exports.registerMember = Joi.object(memberFields);
exports.createMemberStaff = Joi.object({
  ...memberFields,
  paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'online').required(),
});

exports.updateMember = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  phone,
  email: Joi.string().trim().email().max(150).required(),
  address: Joi.string().trim().min(3).max(255).required(),
  age: Joi.number().integer().min(12).max(100).required(),
  trainerId: Joi.number().integer().positive().allow(null),
  password: password.allow('', null),
});

exports.plan = Joi.object({
  planName: Joi.string().trim().min(2).max(60).required(),
  durationMonths: Joi.number().integer().min(1).max(60).required(),
  fee: Joi.number().positive().precision(2).max(99999999).required(),
  description: Joi.string().trim().max(255).allow('', null),
});

const trainerFields = {
  name: Joi.string().trim().min(2).max(100).required(),
  phone,
  email: Joi.string().trim().email().max(150).required(),
  specialization: Joi.string().trim().min(2).max(100).required(),
  experienceYears: Joi.number().integer().min(0).max(60).required(),
};
exports.createTrainer = Joi.object({ ...trainerFields, password: password.required() });
exports.updateTrainer = Joi.object({ ...trainerFields, password: password.allow('', null) });

exports.renew = Joi.object({
  memberId: Joi.number().integer().positive().required(),
  planId: Joi.number().integer().positive().required(),
  method: Joi.string().valid('cash', 'card', 'upi', 'online').required(),
});

exports.markPaid = Joi.object({
  method: Joi.string().valid('cash', 'card', 'upi', 'online').required(),
});

exports.workout = Joi.object({
  memberId: Joi.number().integer().positive().required(),
  title: Joi.string().trim().min(3).max(120).required(),
  description: Joi.string().trim().max(2000).allow('', null),
  startDate: date.required(),
  endDate: date.required(),
  items: Joi.array().min(1).max(60).items(Joi.object({
    exerciseName: Joi.string().trim().min(2).max(100).required(),
    sets: Joi.number().integer().min(1).max(20).required(),
    reps: Joi.number().integer().min(1).max(500).required(),
    day: Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun').required(),
  })).required(),
});

exports.idParam = Joi.object({ id: Joi.number().integer().positive().required() });
exports.workoutQuery = Joi.object({ memberId: Joi.number().integer().positive().required() });
