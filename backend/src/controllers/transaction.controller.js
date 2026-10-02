const transactionService = require('../services/transaction.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Controller: Issue book (Admin only)
 * POST /api/transactions/issue
 */
const issueBook = asyncHandler(async (req, res) => {
  const { reservation_id, book_id, user_id } = req.body;
  const transaction = await transactionService.issueBook({
    reservationId: reservation_id,
    bookId: book_id,
    userId: user_id
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
  const result = await transactionService.returnBook(req.params.id);

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
