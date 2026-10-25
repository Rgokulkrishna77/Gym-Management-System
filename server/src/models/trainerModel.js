const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

exports.list = async (includeContact) => {
  const contact = includeContact ? ', u.email, u.phone' : '';
  const [rows] = await pool.query(
    `SELECT t.trainer_id AS trainerId, u.name, t.specialization,
            t.experience_years AS experienceYears ${contact}
     FROM trainers t JOIN users u ON u.user_id = t.user_id ORDER BY u.name`);
  return rows;
};

const findOne = async (conn, trainerId) => {
  const [rows] = await conn.query(
    `SELECT t.trainer_id AS trainerId, u.name, u.email, u.phone, t.specialization,
            t.experience_years AS experienceYears
     FROM trainers t JOIN users u ON u.user_id = t.user_id WHERE t.trainer_id = ?`, [trainerId]);
  return rows[0];
};

exports.create = async (d) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [u] = await conn.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [d.name, d.email.toLowerCase(), await bcrypt.hash(d.password, 10), 'trainer', d.phone]);
    const [t] = await conn.query(
      'INSERT INTO trainers (user_id, specialization, experience_years) VALUES (?, ?, ?)',
      [u.insertId, d.specialization, d.experienceYears]);
    await conn.commit();
    return await findOne(pool, t.insertId);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.update = async (trainerId, d) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT user_id FROM trainers WHERE trainer_id = ?', [trainerId]);
    if (!rows.length) throw new AppError(404, 'Trainer not found');
    await conn.query('UPDATE users SET name = ?, email = ?, phone = ? WHERE user_id = ?',
      [d.name, d.email.toLowerCase(), d.phone, rows[0].user_id]);
    if (d.password) {
      await conn.query('UPDATE users SET password_hash = ? WHERE user_id = ?',
        [await bcrypt.hash(d.password, 10), rows[0].user_id]);
    }
    await conn.query('UPDATE trainers SET specialization = ?, experience_years = ? WHERE trainer_id = ?',
      [d.specialization, d.experienceYears, trainerId]);
    await conn.commit();
    return await findOne(pool, trainerId);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// Deleting the user cascades to the trainer; members are set to "no trainer" (ON DELETE SET NULL)
exports.remove = async (trainerId) => {
  const [rows] = await pool.query('SELECT user_id FROM trainers WHERE trainer_id = ?', [trainerId]);
  if (!rows.length) throw new AppError(404, 'Trainer not found');
  await pool.query('DELETE FROM users WHERE user_id = ?', [rows[0].user_id]);
};
