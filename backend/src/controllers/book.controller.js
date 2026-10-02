const bookService = require('../services/book.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Controller demonstrating reusable LEFT JOIN query.
 */
const getSampleLeftJoin = asyncHandler(async (req, res) => {
  const books = await bookService.getBooksWithAuthors();
  return ApiResponse.success(res, 'Books retrieved successfully with authors', books);
});

/**
 * Placeholder controller for book operations (to be implemented in future phases).
 */
const getBooksPlaceholder = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 'Endpoint not implemented yet');
});

module.exports = {
  getSampleLeftJoin,
  getBooksPlaceholder
};
