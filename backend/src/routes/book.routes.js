const express = require('express');
const router = express.Router();
const bookService = require('../services/book.service');

// GET /api/books/sample-left-join
// Demonstrates reusable LEFT JOIN query between books and authors
router.get('/sample-left-join', async (req, res) => {
  try {
    const books = await bookService.getBooksWithAuthors();
    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books with authors'
    });
  }
});

module.exports = router;
