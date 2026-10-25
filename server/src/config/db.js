const mysql = require('mysql2/promise');

// One shared connection pool. All queries elsewhere use placeholders (?)
// so user input is never concatenated into SQL (prevents SQL injection).
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gym_db',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,     // DATE columns come back as 'YYYY-MM-DD' (no timezone shifts)
  decimalNumbers: true,  // DECIMAL columns come back as JS numbers
});

module.exports = pool;
