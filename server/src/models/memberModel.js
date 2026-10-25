const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { LATEST_MEMBERSHIP_JOIN, EFFECTIVE_STATUS } = require('../utils/sql');

const MEMBER_SELECT = `
  SELECT m.member_id AS memberId, m.member_code AS memberCode, u.name, u.email, u.phone,
         m.age, m.address, m.join_date AS joinDate, m.trainer_id AS trainerId,
         tu.name AS trainerName, p.plan_id AS planId, p.plan_name AS planName,
         ms.expiry_date AS expiryDate, ${EFFECTIVE_STATUS} AS membershipStatus
  FROM members m
  JOIN users u ON u.user_id = m.user_id
  LEFT JOIN trainers t ON t.trainer_id = m.trainer_id
  LEFT JOIN users tu ON tu.user_id = t.user_id
  ${LATEST_MEMBERSHIP_JOIN}
  LEFT JOIN membership_plans p ON p.plan_id = ms.plan_id`;

exports.list = async () => {
  const [rows] = await pool.query(`${MEMBER_SELECT} ORDER BY m.member_id DESC`);
  return rows;
};

exports.findById = async (memberId) => {
  const [rows] = await pool.query(`${MEMBER_SELECT} WHERE m.member_id = ?`, [memberId]);
  return rows[0];
};

/**
 * Registers a member in ONE transaction:
 * users -> members -> unique Member ID -> membership -> payment.
 * If any step fails everything is rolled back.
 */
exports.create = async (d, { paymentMethod, paymentStatus }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [plans] = await conn.query(
      'SELECT plan_id, plan_name, duration_months, fee FROM membership_plans WHERE plan_id = ?', [d.planId]);
    if (!plans.length) throw new AppError(404, 'Selected plan not found');
    const plan = plans[0];

    const hash = await bcrypt.hash(d.password, 10);
    const [u] = await conn.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [d.name, d.email.toLowerCase(), hash, 'member', d.phone]);
    const [m] = await conn.query(
      'INSERT INTO members (user_id, age, address) VALUES (?, ?, ?)', [u.insertId, d.age, d.address]);

    // Unique Member ID, derived from the auto-increment key: GYM00001, GYM00002 ...
    const memberCode = `GYM${String(m.insertId).padStart(5, '0')}`;
    await conn.query('UPDATE members SET member_code = ? WHERE member_id = ?', [memberCode, m.insertId]);

    const [[dates]] = await conn.query(
      'SELECT CURRENT_DATE AS startDate, DATE_ADD(CURRENT_DATE, INTERVAL ? MONTH) AS expiryDate',
      [plan.duration_months]);
    const [ms] = await conn.query(
      "INSERT INTO memberships (member_id, plan_id, start_date, expiry_date, status) VALUES (?, ?, ?, ?, 'active')",
      [m.insertId, plan.plan_id, dates.startDate, dates.expiryDate]);
    await conn.query(
      'INSERT INTO payments (membership_id, amount, payment_date, method, payment_status) VALUES (?, ?, CURRENT_DATE, ?, ?)',
      [ms.insertId, plan.fee, paymentMethod, paymentStatus]);

    await conn.commit();
    return {
      memberId: m.insertId, memberCode, name: d.name, email: d.email.toLowerCase(),
      planName: plan.plan_name, amount: plan.fee, startDate: dates.startDate,
      expiryDate: dates.expiryDate, paymentStatus,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.update = async (memberId, d) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT user_id FROM members WHERE member_id = ?', [memberId]);
    if (!rows.length) throw new AppError(404, 'Member not found');

    await conn.query('UPDATE users SET name = ?, email = ?, phone = ? WHERE user_id = ?',
      [d.name, d.email.toLowerCase(), d.phone, rows[0].user_id]);
    if (d.password) {
      await conn.query('UPDATE users SET password_hash = ? WHERE user_id = ?',
        [await bcrypt.hash(d.password, 10), rows[0].user_id]);
    }
    await conn.query('UPDATE members SET age = ?, address = ?, trainer_id = ? WHERE member_id = ?',
      [d.age, d.address, d.trainerId || null, memberId]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// Deleting the user cascades to members -> memberships -> payments, workouts
exports.remove = async (memberId) => {
  const [rows] = await pool.query('SELECT user_id FROM members WHERE member_id = ?', [memberId]);
  if (!rows.length) throw new AppError(404, 'Member not found');
  await pool.query('DELETE FROM users WHERE user_id = ?', [rows[0].user_id]);
};

// Everything the member dashboard needs in one object
exports.dashboard = async (memberId) => {
  const member = await exports.findById(memberId);
  if (!member) throw new AppError(404, 'Member not found');

  const [rows] = await pool.query(
    `SELECT ms.membership_id AS membershipId, ms.start_date AS startDate, ms.expiry_date AS expiryDate,
            DATEDIFF(ms.expiry_date, CURRENT_DATE) AS daysRemaining,
            p.plan_name AS planName, p.duration_months AS durationMonths, p.fee,
            (SELECT pay.payment_status FROM payments pay WHERE pay.membership_id = ms.membership_id
             ORDER BY pay.payment_id DESC LIMIT 1) AS paymentStatus,
            (SELECT pay.payment_date FROM payments pay WHERE pay.membership_id = ms.membership_id
             ORDER BY pay.payment_id DESC LIMIT 1) AS lastPaymentDate
     FROM memberships ms JOIN membership_plans p ON p.plan_id = ms.plan_id
     WHERE ms.member_id = ? AND ms.status <> 'cancelled'
     ORDER BY ms.expiry_date DESC, ms.membership_id DESC LIMIT 1`, [memberId]);
  const current = rows[0] || null;
  return {
    member,
    membership: current && { ...current, expired: current.daysRemaining < 0 },
  };
};
