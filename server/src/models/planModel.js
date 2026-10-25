const pool = require('../config/db');
const AppError = require('../utils/AppError');

const COLS = `plan_id AS planId, plan_name AS planName, duration_months AS durationMonths,
              fee, description`;

exports.list = async () => {
  const [rows] = await pool.query(`SELECT ${COLS} FROM membership_plans ORDER BY duration_months`);
  return rows;
};

exports.create = async (d) => {
  const [r] = await pool.query(
    'INSERT INTO membership_plans (plan_name, duration_months, fee, description) VALUES (?, ?, ?, ?)',
    [d.planName, d.durationMonths, d.fee, d.description || null]);
  const [rows] = await pool.query(`SELECT ${COLS} FROM membership_plans WHERE plan_id = ?`, [r.insertId]);
  return rows[0];
};

exports.update = async (id, d) => {
  const [exists] = await pool.query('SELECT 1 FROM membership_plans WHERE plan_id = ?', [id]);
  if (!exists.length) throw new AppError(404, 'Plan not found');
  await pool.query(
    'UPDATE membership_plans SET plan_name = ?, duration_months = ?, fee = ?, description = ? WHERE plan_id = ?',
    [d.planName, d.durationMonths, d.fee, d.description || null, id]);
  const [rows] = await pool.query(`SELECT ${COLS} FROM membership_plans WHERE plan_id = ?`, [id]);
  return rows[0];
};

// FK is ON DELETE RESTRICT: plans already bought by members cannot be deleted (409)
exports.remove = async (id) => {
  const [r] = await pool.query('DELETE FROM membership_plans WHERE plan_id = ?', [id]);
  if (!r.affectedRows) throw new AppError(404, 'Plan not found');
};
