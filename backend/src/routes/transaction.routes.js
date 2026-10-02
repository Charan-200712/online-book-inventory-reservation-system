const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// User transaction history
router.get('/', authenticate, transactionController.getUserTransactions);

// Admin queries (must precede /:id routes)
router.get('/all', authenticate, authorizeRoles('ADMIN'), transactionController.getAllTransactions);
router.get('/overdue', authenticate, authorizeRoles('ADMIN'), transactionController.getOverdueTransactions);

// Admin circulation actions
router.post('/issue', authenticate, authorizeRoles('ADMIN'), transactionController.issueBook);
router.post('/:id/return', authenticate, authorizeRoles('ADMIN'), transactionController.returnBook);

module.exports = router;
