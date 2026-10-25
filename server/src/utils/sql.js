// Shared SQL fragment: joins each member (alias m) to their LATEST non-cancelled
// membership (alias ms). Membership status shown to users is derived from the
// expiry date, so it is always correct even if no cron job updates the column.
const LATEST_MEMBERSHIP_JOIN = `
  LEFT JOIN memberships ms ON ms.membership_id = (
    SELECT x.membership_id FROM memberships x
    WHERE x.member_id = m.member_id AND x.status <> 'cancelled'
    ORDER BY x.expiry_date DESC, x.membership_id DESC LIMIT 1)`;

const EFFECTIVE_STATUS = `
  CASE WHEN ms.membership_id IS NULL THEN 'none'
       WHEN ms.expiry_date < CURRENT_DATE THEN 'expired'
       ELSE 'active' END`;

module.exports = { LATEST_MEMBERSHIP_JOIN, EFFECTIVE_STATUS };
