const healthService = require('../services/health.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller for GET /api/health
 * Checks backend and database status safely.
 */
const getHealthStatus = asyncHandler(async (req, res) => {
  const { isConnected } = await healthService.checkDatabaseHealth();

  if (isConnected) {
    return res.status(200).json({
      success: true,
      message: 'Online Book Inventory & Reservation System API is running',
      database: 'connected'
    });
  }

  return res.status(503).json({
    success: false,
    message: 'Online Book Inventory & Reservation System API is running',
    database: 'disconnected',
    error: 'Database connection unavailable'
  });
});

module.exports = {
  getHealthStatus
};
