const db = require('../config/db');

/**
 * Service to verify database pool health.
 *
 * @returns {Promise<{ isConnected: boolean, error?: string }>}
 */
async function checkDatabaseHealth() {
  try {
    await db.testConnection();
    return { isConnected: true };
  } catch (error) {
    return {
      isConnected: false,
      error: error.message
    };
  }
}

module.exports = {
  checkDatabaseHealth
};
