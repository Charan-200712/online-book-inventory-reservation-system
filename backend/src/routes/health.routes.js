const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Online Book Inventory & Reservation System API is running'
  });
});

module.exports = router;
