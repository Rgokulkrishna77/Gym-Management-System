const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const memberModel = require('../models/memberModel');

// A real bcrypt hash used so login takes the same time whether or not the email exists
const DUMMY_HASH = '$2b$10$Kt0JdxMQyBkOkmx9tZR/a.OiPWwPcWs3JPmSZCza.9Gd.cxzRIJvq';

const USER_QUERY = `
  SELECT u.user_id AS id, u.name, u.email, u.role, u.phone, u.password_hash,
         m.member_id AS memberId, m.member_code AS memberCode, t.trainer_id AS trainerId
  FROM users u
  LEFT JOIN members m ON m.user_id = u.user_id
  LEFT JOIN trainers t ON t.user_id = u.user_id`;

const publicUser = ({ password_hash, ...u }) => u; // eslint-disable-line no-unused-vars

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query(`${USER_QUERY} WHERE u.email = ?`, [email.toLowerCase()]);
  const user = rows[0];
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Invalid email or password');

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, memberId: user.memberId, trainerId: user.trainerId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ success: true, token, user: publicUser(user) });
});

// Returns the logged-in user (used by the client to restore a session on page reload)
exports.me = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${USER_QUERY} WHERE u.user_id = ?`, [req.user.id]);
  if (!rows.length) throw new AppError(401, 'Account no longer exists');
  res.json({ success: true, user: publicUser(rows[0]) });
});

// Public self-registration: creates a member with a PENDING online payment
exports.register = asyncHandler(async (req, res) => {
  const result = await memberModel.create(req.body, { paymentMethod: 'online', paymentStatus: 'pending' });
  res.status(201).json({
    success: true,
    message: `Registration successful! Your Member ID is ${result.memberCode}.`,
    data: result,
  });
});
