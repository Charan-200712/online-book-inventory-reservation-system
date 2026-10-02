const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Phase 2/3/4 Backward compatibility
router.get('/sample-left-join', bookController.getSampleLeftJoin);

// Live search endpoint (must precede /:id)
router.get('/search', authenticate, bookController.searchBooks);

// Authenticated catalog endpoints
router.get('/', authenticate, bookController.getAllBooks);
router.get('/:id', authenticate, bookController.getBookById);

// Admin-only management endpoints
router.post('/', authenticate, authorizeRoles('ADMIN'), bookController.createBook);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), bookController.updateBook);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), bookController.deleteBook);

module.exports = router;
