require('dotenv').config();
const pool = require('./config/db');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

const app = require('./app');
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await pool.query('SELECT 1'); // fail fast if MySQL is unreachable
    app.listen(PORT, () => console.log(`Gym API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Cannot connect to MySQL:', err.message);
    process.exit(1);
  }
})();
