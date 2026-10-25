const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const auth = require('../controllers/authController');
const members = require('../controllers/memberController');
const plans = require('../controllers/planController');
const trainers = require('../controllers/trainerController');
const memberships = require('../controllers/membershipController');
const workouts = require('../controllers/workoutController');
const stats = require('../controllers/statsController');

const id = validate(s.idParam, 'params');
const staff = authorize('admin', 'receptionist');

// ---- Auth (login is rate-limited against brute force) ----
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' } });
router.post('/auth/login', loginLimiter, validate(s.login), auth.login);
router.post('/auth/register', validate(s.registerMember), auth.register);
router.get('/auth/me', authenticate, auth.me);

// ---- Plans (public read, admin write) ----
router.get('/plans', plans.list);
router.post('/plans', authenticate, authorize('admin'), validate(s.plan), plans.create);
router.put('/plans/:id', authenticate, authorize('admin'), id, validate(s.plan), plans.update);
router.delete('/plans/:id', authenticate, authorize('admin'), id, plans.remove);

// ---- Trainers (public read of basic info, admin write) ----
router.get('/trainers', optionalAuth, trainers.list);
router.post('/trainers', authenticate, authorize('admin'), validate(s.createTrainer), trainers.create);
router.put('/trainers/:id', authenticate, authorize('admin'), id, validate(s.updateTrainer), trainers.update);
router.delete('/trainers/:id', authenticate, authorize('admin'), id, trainers.remove);

// ---- Members ----
router.get('/members/me', authenticate, authorize('member'), members.myDashboard); // before /:id
router.get('/members', authenticate, authorize('admin', 'receptionist', 'trainer'), members.list);
router.get('/members/:id', authenticate, authorize('admin', 'receptionist', 'trainer'), id, members.getOne);
router.post('/members', authenticate, staff, validate(s.createMemberStaff), members.create);
router.put('/members/:id', authenticate, authorize('admin'), id, validate(s.updateMember), members.update);
router.delete('/members/:id', authenticate, authorize('admin'), id, members.remove);

// ---- Memberships & payments ----
router.get('/memberships/expired', authenticate, staff, memberships.listExpired);
router.post('/memberships/renew', authenticate, staff, validate(s.renew), memberships.renew);
router.get('/payments/pending', authenticate, staff, memberships.listPendingPayments);
router.patch('/payments/:id/pay', authenticate, staff, id, validate(s.markPaid), memberships.markPaid);

// ---- Workouts ----
router.get('/workouts/me', authenticate, authorize('member'), workouts.mine); // before other routes
router.get('/workouts', authenticate, authorize('trainer', 'admin'), validate(s.workoutQuery, 'query'), workouts.listForMember);
router.post('/workouts', authenticate, authorize('trainer', 'admin'), validate(s.workout), workouts.create);
router.put('/workouts/:id', authenticate, authorize('trainer', 'admin'), id, validate(s.workout), workouts.update);

// ---- Admin dashboard ----
router.get('/admin/stats', authenticate, authorize('admin'), stats.dashboard);

module.exports = router;
