const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/health
router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';

  try {
    const [rows] = await db.query('SELECT 1');
    if (rows) {
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = 'disconnected';
  }

  res.status(200).json({
    success: true,
    message: 'Online Book Inventory & Reservation System API is running',
    database: dbStatus
  });
});

module.exports = router;
