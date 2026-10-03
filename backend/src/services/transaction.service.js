const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const DEFAULT_LOAN_DAYS = 14;

/**
 * Gets configured loan period in days.
 *
 * @returns {number}
 */
function getLoanDays() {
  const days = parseInt(process.env.BOOK_LOAN_DAYS, 10);
  return !isNaN(days) && days > 0 ? days : DEFAULT_LOAN_DAYS;
}

/**
 * Issues a book to a user either by fulfilling a reservation or direct checkout.
 * Operates safely inside a MySQL transaction with row-level locks.
 *
 * @param {Object} params
 * @param {number} [params.reservationId]
 * @param {number} [params.bookId]
 * @param {number} [params.userId]
 * @returns {Promise<Object>} Created transaction record
 */
async function issueBook({ reservationId, bookId, userId }) {
  const connection = await db.getConnection();
  const loanDays = getLoanDays();

  try {
    await connection.beginTransaction();

    let finalUserId;
    let finalBookId;
    let finalReservationId = null;

    if (reservationId) {
      // 1A. Fulfilling an existing reservation
      const [resRows] = await connection.query(
        'SELECT * FROM reservations WHERE id = ? FOR UPDATE',
        [reservationId]
      );

      if (resRows.length === 0) {
        throw ApiError.notFound('Reservation not found');
      }

      const reservation = resRows[0];

      if (reservation.status === 'CANCELLED') {
        throw ApiError.conflict('Cannot issue book for a CANCELLED reservation');
      }

      if (reservation.status === 'COMPLETED') {
        throw ApiError.conflict('Cannot issue book for an already COMPLETED reservation');
      }

      finalUserId = reservation.user_id;
      finalBookId = reservation.book_id;
      finalReservationId = reservation.id;

      // Mark reservation as COMPLETED
      await connection.query(
        'UPDATE reservations SET status = ? WHERE id = ?',
        ['COMPLETED', reservation.id]
      );

      // Note on inventory: The copy was already reserved and decremented in Phase 6 Design A,
      // so we do not decrement inventory a second time.
    } else {
      // 1B. Direct issue without reservation
      if (!bookId || !userId) {
        throw ApiError.badRequest('Either reservation_id or both book_id and user_id are required');
      }

      // Check user exists
      const [userRows] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
      if (userRows.length === 0) {
        throw ApiError.notFound('User not found');
      }

      // Row-lock book
      const [bookRows] = await connection.query(
        'SELECT id, title, total_copies, available_copies FROM books WHERE id = ? FOR UPDATE',
        [bookId]
      );

      if (bookRows.length === 0) {
        throw ApiError.notFound('Book not found');
      }

      if (bookRows[0].available_copies <= 0) {
        throw ApiError.conflict(`No available copies for '${bookRows[0].title}' to issue`);
      }

      // Decrement inventory for direct issue
      await connection.query(
        'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
        [bookId]
      );

      finalUserId = userId;
      finalBookId = bookId;
    }

    // 2. Insert transaction with calculated due date
    const [txResult] = await connection.query(
      `INSERT INTO transactions (user_id, book_id, reservation_id, issue_date, due_date, status)
       VALUES (?, ?, ?, NOW(), DATE_ADD(CURDATE(), INTERVAL ? DAY), 'ISSUED')`,
      [finalUserId, finalBookId, finalReservationId, loanDays]
    );

    // Retrieve inserted transaction details
    const [insertedTx] = await connection.query(
      `SELECT t.*, b.title AS book_title
       FROM transactions t
       JOIN books b ON t.book_id = b.id
       WHERE t.id = ?`,
      [txResult.insertId]
    );

    await connection.commit();

    return insertedTx[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Returns a borrowed book, updating the transaction status and restoring available inventory.
 *
 * @param {number|string} transactionId
 * @returns {Promise<Object>}
 */
async function returnBook(transactionId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the transaction record
    const [txRows] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? FOR UPDATE',
      [transactionId]
    );

    if (txRows.length === 0) {
      throw ApiError.notFound('Transaction not found');
    }

    const tx = txRows[0];

    if (tx.status === 'RETURNED') {
      throw ApiError.conflict('Book has already been returned for this transaction');
    }

    // 2. Lock book and safely increment available copies
    await connection.query(
      'SELECT id, available_copies, total_copies FROM books WHERE id = ? FOR UPDATE',
      [tx.book_id]
    );

    await connection.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [tx.book_id]
    );

    // 3. Mark transaction as RETURNED
    await connection.query(
      'UPDATE transactions SET return_date = CURDATE(), status = ? WHERE id = ?',
      ['RETURNED', transactionId]
    );

    await connection.commit();

    return {
      id: Number(transactionId),
      book_id: tx.book_id,
      user_id: tx.user_id,
      return_date: new Date(),
      status: 'RETURNED',
      message: 'Book returned successfully and inventory restored'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Retrieves all transactions belonging to a specific user.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function getUserTransactions(userId) {
  const query = `
    SELECT
        t.id,
        t.user_id,
        t.book_id,
        t.reservation_id,
        t.issue_date,
        t.due_date,
        t.return_date,
        IF(t.status = 'ISSUED' AND t.due_date < CURDATE(), 'OVERDUE', t.status) AS status,
        b.title AS book_title,
        b.isbn AS book_isbn,
        a.name AS author_name
    FROM transactions t
    JOIN books b ON t.book_id = b.id
    LEFT JOIN authors a ON b.author_id = a.id
    WHERE t.user_id = ?
    ORDER BY t.issue_date DESC;
  `;

  const [transactions] = await db.query(query, [userId]);
  return transactions;
}

/**
 * Retrieves all borrowing transactions across the entire library system (Admin only).
 *
 * @returns {Promise<Array>}
 */
async function getAllTransactions() {
  const query = `
    SELECT
        t.id,
        t.user_id,
        t.book_id,
        t.reservation_id,
        t.issue_date,
        t.due_date,
        t.return_date,
        IF(t.status = 'ISSUED' AND t.due_date < CURDATE(), 'OVERDUE', t.status) AS status,
        u.name AS user_name,
        u.email AS user_email,
        b.title AS book_title,
        b.isbn AS book_isbn,
        a.name AS author_name
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    JOIN books b ON t.book_id = b.id
    LEFT JOIN authors a ON b.author_id = a.id
    ORDER BY t.issue_date DESC;
  `;

  const [transactions] = await db.query(query);
  return transactions;
}

/**
 * Retrieves all currently overdue transactions.
 *
 * @returns {Promise<Array>}
 */
async function getOverdueTransactions() {
  const query = `
    SELECT
        t.id,
        t.user_id,
        t.book_id,
        t.issue_date,
        t.due_date,
        DATEDIFF(CURDATE(), t.due_date) AS days_overdue,
        u.name AS user_name,
        u.email AS user_email,
        b.title AS book_title,
        b.isbn AS book_isbn
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    JOIN books b ON t.book_id = b.id
    WHERE t.return_date IS NULL
      AND (t.status = 'OVERDUE' OR t.due_date < CURDATE())
    ORDER BY t.due_date ASC;
  `;

  const [transactions] = await db.query(query);
  return transactions;
}

/**
 * Renews an active loan, extending the due date by the standard loan duration (Admin only).
 *
 * @param {number} transactionId
 * @returns {Promise<Object>} Updated transaction
 */
async function renewLoan(transactionId) {
  const loanDays = getLoanDays();
  const [rows] = await db.query(
    'SELECT * FROM transactions WHERE id = ?',
    [transactionId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Transaction not found');
  }

  const tx = rows[0];
  if (tx.status === 'RETURNED') {
    throw ApiError.conflict('Cannot renew a book that has already been returned');
  }

  // Extend due date by loanDays from current due date or today, whichever is later
  await db.query(
    'UPDATE transactions SET due_date = DATE_ADD(GREATEST(due_date, CURDATE()), INTERVAL ? DAY), status = "ISSUED" WHERE id = ?',
    [loanDays, transactionId]
  );

  const [updatedRows] = await db.query(
    `SELECT t.*, b.title AS book_title
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     WHERE t.id = ?`,
    [transactionId]
  );

  return updatedRows[0];
}

module.exports = {
  issueBook,
  returnBook,
  renewLoan,
  getUserTransactions,
  getAllTransactions,
  getOverdueTransactions
};
