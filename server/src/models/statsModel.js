const pool = require('../config/db');
const { LATEST_MEMBERSHIP_JOIN } = require('../utils/sql');

exports.dashboard = async () => {
  const [[counts]] = await pool.query(
    `SELECT COUNT(*) AS totalMembers,
            COALESCE(SUM(ms.expiry_date >= CURRENT_DATE), 0) AS activeMemberships,
            COALESCE(SUM(ms.expiry_date <  CURRENT_DATE), 0) AS expiredMemberships
     FROM members m ${LATEST_MEMBERSHIP_JOIN}`);

  const [[rev]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS monthlyRevenue FROM payments
     WHERE payment_status = 'paid'
       AND payment_date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
       AND payment_date <= LAST_DAY(CURRENT_DATE)`);

  const [[tr]] = await pool.query('SELECT COUNT(*) AS trainerCount FROM trainers');

  const [revenueByMonth] = await pool.query(
    `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month, SUM(amount) AS revenue
     FROM payments
     WHERE payment_status = 'paid'
       AND payment_date >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 5 MONTH)
     GROUP BY month ORDER BY month`);

  const [planDistribution] = await pool.query(
    `SELECT p.plan_name AS name, COUNT(*) AS count
     FROM members m ${LATEST_MEMBERSHIP_JOIN}
     JOIN membership_plans p ON p.plan_id = ms.plan_id
     GROUP BY p.plan_name ORDER BY count DESC`);

  return {
    totalMembers: Number(counts.totalMembers),
    activeMemberships: Number(counts.activeMemberships),
    expiredMemberships: Number(counts.expiredMemberships),
    monthlyRevenue: Number(rev.monthlyRevenue),
    trainerCount: Number(tr.trainerCount),
    revenueByMonth: revenueByMonth.map((r) => ({ month: r.month, revenue: Number(r.revenue) })),
    planDistribution: planDistribution.map((r) => ({ name: r.name, count: Number(r.count) })),
  };
};
