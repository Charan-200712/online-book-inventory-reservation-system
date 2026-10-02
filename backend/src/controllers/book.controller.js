const bookService = require('../services/book.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Controller: Backward-compatible LEFT JOIN demonstration
 * GET /api/books/sample-left-join
 */
const getSampleLeftJoin = asyncHandler(async (req, res) => {
  const books = await bookService.getBooksWithAuthors();
  return ApiResponse.success(res, 'Books retrieved successfully with authors', books);
});

/**
 * Controller: Get all books (with optional availability filter and pagination)
 * GET /api/books
 */
const getAllBooks = asyncHandler(async (req, res) => {
  const { available, page, limit } = req.query;
  const result = await bookService.getAllBooks({ available, page, limit });

  return res.status(200).json({
    success: true,
    count: result.books.length,
    books: result.books,
    pagination: result.pagination
  });
});

/**
 * Controller: Live search books
 * GET /api/books/search?q=term
 */
const searchBooks = asyncHandler(async (req, res) => {
  const { q, available } = req.query;
  const books = await bookService.searchBooks(q, { available });

  return res.status(200).json({
    success: true,
    query: q || '',
    count: books.length,
    books
  });
});

/**
 * Controller: Get book by ID
 * GET /api/books/:id
 */
const getBookById = asyncHandler(async (req, res) => {
  const book = await bookService.getBookById(req.params.id);

  return res.status(200).json({
    success: true,
    book
  });
});

/**
 * Controller: Create book (Admin only)
 * POST /api/books
 */
const createBook = asyncHandler(async (req, res) => {
  const book = await bookService.createBook(req.body);

  return res.status(201).json({
    success: true,
    message: 'Book created successfully',
    book
  });
});

/**
 * Controller: Update book (Admin only)
 * PUT /api/books/:id
 */
const updateBook = asyncHandler(async (req, res) => {
  const book = await bookService.updateBook(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: 'Book updated successfully',
    book
  });
});

/**
 * Controller: Delete book (Admin only)
 * DELETE /api/books/:id
 */
const deleteBook = asyncHandler(async (req, res) => {
  const result = await bookService.deleteBook(req.params.id);
  return ApiResponse.success(res, result.message);
});

module.exports = {
  getSampleLeftJoin,
  getAllBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
