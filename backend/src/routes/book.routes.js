const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');

// GET /api/books/sample-left-join - Reusable LEFT JOIN demonstration from Phase 2
router.get('/sample-left-join', bookController.getSampleLeftJoin);

// GET /api/books - Placeholder for Phase 5 Book CRUD
router.get('/', bookController.getBooksPlaceholder);

module.exports = router;
