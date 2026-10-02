const express = require('express');
const router = express.Router();
const authorController = require('../controllers/author.controller');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Authenticated routes (USER & ADMIN)
router.get('/', authenticate, authorController.getAllAuthors);
router.get('/:id', authenticate, authorController.getAuthorById);

// Admin-only management routes
router.post('/', authenticate, authorizeRoles('ADMIN'), authorController.createAuthor);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), authorController.updateAuthor);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), authorController.deleteAuthor);

module.exports = router;
