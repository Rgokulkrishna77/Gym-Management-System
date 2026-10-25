const pool = require('../config/db');

// Reads the v_expired_memberships view (latest membership per member that has expired)
exports.listExpired = async () => {
  const [rows] = await pool.query(
    `SELECT member_id AS memberId, member_code AS memberCode, name, email, phone,
            plan_id AS planId, plan_name AS planName, fee, expiry_date AS expiryDate,
            days_expired AS daysExpired
     FROM v_expired_memberships ORDER BY expiry_date ASC`);
  return rows;
};

// Calls the stored procedure sp_renew_membership (transactional: membership + payment).
// OUT parameters are session variables, so everything runs on ONE connection.
exports.renew = async ({ memberId, planId, method }) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('CALL sp_renew_membership(?, ?, ?, @mid, @expiry, @amount)', [memberId, planId, method]);
    const [[out]] = await conn.query(
      'SELECT @mid AS membershipId, @expiry AS expiryDate, @amount AS amount');
    const [[info]] = await conn.query(
      `SELECT m.member_code AS memberCode, u.name, p.plan_name AS planName, ms.start_date AS startDate
       FROM memberships ms JOIN members m ON m.member_id = ms.member_id
       JOIN users u ON u.user_id = m.user_id JOIN membership_plans p ON p.plan_id = ms.plan_id
       WHERE ms.membership_id = ?`, [out.membershipId]);
    return { ...info, ...out, memberId, method, paymentStatus: 'paid' };
  } finally {
    conn.release();
  }
};

exports.listPendingPayments = async () => {
  const [rows] = await pool.query(
    `SELECT pay.payment_id AS paymentId, m.member_code AS memberCode, u.name, p.plan_name AS planName,
            pay.amount, pay.payment_date AS paymentDate, pay.method
     FROM payments pay JOIN memberships ms ON ms.membership_id = pay.membership_id
     JOIN members m ON m.member_id = ms.member_id JOIN users u ON u.user_id = m.user_id
     JOIN membership_plans p ON p.plan_id = ms.plan_id
     WHERE pay.payment_status = 'pending' ORDER BY pay.payment_id`);
  return rows;
};

exports.markPaid = async (paymentId, method) => {
  const [r] = await pool.query(
    `UPDATE payments SET payment_status = 'paid', payment_date = CURRENT_DATE, method = ?
     WHERE payment_id = ? AND payment_status = 'pending'`, [method, paymentId]);
  return r.affectedRows > 0;
};
