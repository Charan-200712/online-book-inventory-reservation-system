const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/ApiResponse');

// Placeholder for future Author Management
router.all('*', (req, res) => {
  return ApiResponse.success(res, 'Endpoint not implemented yet');
});

module.exports = router;
