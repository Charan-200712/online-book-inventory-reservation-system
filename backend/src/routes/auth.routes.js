const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Public authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes (requires valid JWT)
router.get('/me', authenticate, authController.getMe);

// Protected test route (requires valid JWT with ADMIN role)
router.get('/admin-test', authenticate, authorizeRoles('ADMIN'), authController.adminTest);

module.exports = router;
