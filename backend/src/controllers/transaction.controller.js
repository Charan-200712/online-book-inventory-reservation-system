const transactionService = require('../services/transaction.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Controller: Issue book (Admin only)
 * POST /api/transactions/issue
 */
const issueBook = asyncHandler(async (req, res) => {
  const { reservation_id, book_id, user_id } = req.body;

  const reservationId = reservation_id ? parseInt(reservation_id, 10) : null;
  const bookId = book_id ? parseInt(book_id, 10) : null;
  const userId = user_id ? parseInt(user_id, 10) : null;

  if (reservation_id && (isNaN(reservationId) || reservationId <= 0)) {
    throw ApiError.badRequest('Invalid reservation_id. Must be a positive integer.');
  }

  if (!reservation_id) {
    if (!bookId || isNaN(bookId) || bookId <= 0) {
      throw ApiError.badRequest('Valid book_id is required for direct issue.');
    }
    if (!userId || isNaN(userId) || userId <= 0) {
      throw ApiError.badRequest('Valid user_id is required for direct issue.');
    }
  }

  const transaction = await transactionService.issueBook({
    reservationId,
    bookId,
    userId
  });

  return res.status(201).json({
    success: true,
    message: 'Book issued successfully',
    transaction
  });
});

/**
 * Controller: Return book (Admin only)
 * POST /api/transactions/:id/return
 */
const returnBook = asyncHandler(async (req, res) => {
  const transactionId = parseInt(req.params.id, 10);
  if (isNaN(transactionId) || transactionId <= 0) {
    throw ApiError.badRequest('Invalid transaction ID. Must be a positive integer.');
  }

  const result = await transactionService.returnBook(transactionId);

  return res.status(200).json({
    success: true,
    message: result.message,
    transaction: result
  });
});

/**
 * Controller: Get transactions of authenticated user
 * GET /api/transactions
 */
const getUserTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getUserTransactions(req.user.userId);

  return res.status(200).json({
    success: true,
    count: transactions.length,
    transactions
  });
});

/**
 * Controller: Get all transactions (Admin only)
 * GET /api/transactions/all
 */
const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getAllTransactions();

  return res.status(200).json({
    success: true,
    count: transactions.length,
    transactions
  });
});

/**
 * Controller: Get overdue transactions (Admin only)
 * GET /api/transactions/overdue
 */
const getOverdueTransactions = asyncHandler(async (req, res) => {
  const overdueTransactions = await transactionService.getOverdueTransactions();

  return res.status(200).json({
    success: true,
    count: overdueTransactions.length,
    overdueTransactions
  });
});

module.exports = {
  issueBook,
  returnBook,
  getUserTransactions,
  getAllTransactions,
  getOverdueTransactions
};
