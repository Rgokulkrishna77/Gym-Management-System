const pool = require('../config/db');
const AppError = require('../utils/AppError');

const PLAN_SELECT = `
  SELECT w.workout_id AS workoutId, w.member_id AS memberId, w.trainer_id AS trainerId,
         w.title, w.description, w.start_date AS startDate, w.end_date AS endDate,
         w.updated_at AS updatedAt, tu.name AS trainerName
  FROM workout_plans w
  LEFT JOIN trainers t ON t.trainer_id = w.trainer_id
  LEFT JOIN users tu ON tu.user_id = t.user_id`;

// Attaches the exercise rows to each plan (one extra query, not N+1)
const withItems = async (plans) => {
  if (!plans.length) return plans;
  const [items] = await pool.query(
    `SELECT item_id AS itemId, workout_id AS workoutId, exercise_name AS exerciseName, sets, reps, day
     FROM workout_plan_items WHERE workout_id IN (?)
     ORDER BY FIELD(day,'Mon','Tue','Wed','Thu','Fri','Sat','Sun'), item_id`, [plans.map((p) => p.workoutId)]);
  return plans.map((p) => ({ ...p, items: items.filter((i) => i.workoutId === p.workoutId) }));
};

exports.listForMember = async (memberId) => {
  const [rows] = await pool.query(`${PLAN_SELECT} WHERE w.member_id = ? ORDER BY w.updated_at DESC`, [memberId]);
  return withItems(rows);
};

const insertItems = (conn, workoutId, items) =>
  conn.query('INSERT INTO workout_plan_items (workout_id, exercise_name, sets, reps, day) VALUES ?',
    [items.map((i) => [workoutId, i.exerciseName, i.sets, i.reps, i.day])]);

exports.create = async (d, trainerId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [w] = await conn.query(
      `INSERT INTO workout_plans (member_id, trainer_id, title, description, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [d.memberId, trainerId || null, d.title, d.description || null, d.startDate, d.endDate]);
    await insertItems(conn, w.insertId, d.items);
    await conn.commit();
    return w.insertId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// Update = replace the plan fields and its exercise list in one transaction
exports.update = async (workoutId, d, trainerId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [exists] = await conn.query('SELECT 1 FROM workout_plans WHERE workout_id = ?', [workoutId]);
    if (!exists.length) throw new AppError(404, 'Workout plan not found');
    await conn.query(
      `UPDATE workout_plans SET title = ?, description = ?, start_date = ?, end_date = ?,
              trainer_id = COALESCE(?, trainer_id), updated_at = NOW() WHERE workout_id = ?`,
      [d.title, d.description || null, d.startDate, d.endDate, trainerId || null, workoutId]);
    await conn.query('DELETE FROM workout_plan_items WHERE workout_id = ?', [workoutId]);
    await insertItems(conn, workoutId, d.items);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};
