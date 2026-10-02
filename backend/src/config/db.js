const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Tests database connectivity using the connection pool.
 * Properly acquires and releases a connection.
 *
 * @returns {Promise<{ connected: boolean, message: string }>}
 */
pool.testConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1 AS health');
    return {
      connected: true,
      message: 'Database connection pool established successfully'
    };
  } finally {
    connection.release();
  }
};

module.exports = pool;
