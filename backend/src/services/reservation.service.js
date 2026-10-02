const db = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Creates a reservation and safely holds 1 copy using a MySQL transaction with row-level locks.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.bookId
 * @returns {Promise<Object>} Created reservation
 */
async function createReservation({ userId, bookId }) {
  if (!bookId || isNaN(Number(bookId))) {
    throw ApiError.badRequest('Valid book_id is required');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the book record to inspect and hold inventory atomically
    const [bookRows] = await connection.query(
      'SELECT id, title, total_copies, available_copies FROM books WHERE id = ? FOR UPDATE',
      [bookId]
    );

    if (bookRows.length === 0) {
      throw ApiError.notFound('Book not found');
    }

    const book = bookRows[0];

    // 2. Verify book availability
    if (book.available_copies <= 0) {
      throw ApiError.conflict(`No available copies for '${book.title}' at this time`);
    }

    // 3. Verify user does not already have an active (PENDING or APPROVED) reservation for this book
    const [existingActive] = await connection.query(
      `SELECT id, status FROM reservations
       WHERE user_id = ? AND book_id = ? AND status IN ('PENDING', 'APPROVED')
       FOR UPDATE`,
      [userId, bookId]
    );

    if (existingActive.length > 0) {
      throw ApiError.conflict('You already have an active reservation for this book');
    }

    // 4. Safely decrement available copies (Design A: Reservation immediately holds a copy)
    await connection.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [bookId]
    );

    // 5. Insert reservation record
    const [insertResult] = await connection.query(
      'INSERT INTO reservations (user_id, book_id, reservation_date, status) VALUES (?, ?, NOW(), ?)',
      [userId, bookId, 'PENDING']
    );

    await connection.commit();

    return {
      id: insertResult.insertId,
      user_id: userId,
      book_id: Number(bookId),
      book_title: book.title,
      reservation_date: new Date(),
      status: 'PENDING',
      remaining_available_copies: book.available_copies - 1
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Retrieves all reservations belonging to a specific user.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function getUserReservations(userId) {
  const query = `
    SELECT
        r.id,
        r.user_id,
        r.book_id,
        r.reservation_date,
        r.status,
        b.title AS book_title,
        b.isbn AS book_isbn,
        b.category,
        a.name AS author_name
    FROM reservations r
    JOIN books b ON r.book_id = b.id
    LEFT JOIN authors a ON b.author_id = a.id
    WHERE r.user_id = ?
    ORDER BY r.reservation_date DESC;
  `;

  const [reservations] = await db.query(query, [userId]);
  return reservations;
}

/**
 * Retrieves all reservations across the entire system (Admin only).
 *
 * @returns {Promise<Array>}
 */
async function getAllReservations() {
  const query = `
    SELECT
        r.id,
        r.user_id,
        r.book_id,
        r.reservation_date,
        r.status,
        u.name AS user_name,
        u.email AS user_email,
        b.title AS book_title,
        b.isbn AS book_isbn,
        a.name AS author_name
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN books b ON r.book_id = b.id
    LEFT JOIN authors a ON b.author_id = a.id
    ORDER BY r.reservation_date DESC;
  `;

  const [reservations] = await db.query(query);
  return reservations;
}

/**
 * Retrieves a single reservation by ID with ownership/admin authorization check.
 *
 * @param {number|string} id
 * @param {Object} requestingUser - { userId, role }
 * @returns {Promise<Object>}
 */
async function getReservationById(id, requestingUser) {
  const query = `
    SELECT
        r.id,
        r.user_id,
        r.book_id,
        r.reservation_date,
        r.status,
        u.name AS user_name,
        u.email AS user_email,
        b.title AS book_title,
        b.isbn AS book_isbn,
        a.name AS author_name
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN books b ON r.book_id = b.id
    LEFT JOIN authors a ON b.author_id = a.id
    WHERE r.id = ?
    LIMIT 1;
  `;

  const [rows] = await db.query(query, [id]);

  if (rows.length === 0) {
    throw ApiError.notFound('Reservation not found');
  }

  const reservation = rows[0];

  // User ownership validation
  if (requestingUser.role !== 'ADMIN' && reservation.user_id !== requestingUser.userId) {
    throw ApiError.forbidden('You are not authorized to view this reservation');
  }

  return reservation;
}

/**
 * Cancels a reservation and restores the held copy back to available inventory inside a transaction.
 *
 * @param {number|string} id
 * @param {Object} requestingUser
 * @returns {Promise<Object>} Cancelled reservation
 */
async function cancelReservation(id, requestingUser) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the reservation record
    const [rows] = await connection.query(
      'SELECT id, user_id, book_id, status FROM reservations WHERE id = ? FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      throw ApiError.notFound('Reservation not found');
    }

    const reservation = rows[0];

    // Ownership check
    if (requestingUser.role !== 'ADMIN' && reservation.user_id !== requestingUser.userId) {
      throw ApiError.forbidden('You are not authorized to cancel this reservation');
    }

    // State transition validation
    if (reservation.status === 'CANCELLED') {
      throw ApiError.conflict('Reservation is already cancelled');
    }

    if (reservation.status === 'COMPLETED') {
      throw ApiError.conflict('Cannot cancel a completed reservation');
    }

    // 2. Lock book and restore held copy to inventory (if reservation was active)
    if (reservation.status === 'PENDING' || reservation.status === 'APPROVED') {
      await connection.query(
        'SELECT id, available_copies, total_copies FROM books WHERE id = ? FOR UPDATE',
        [reservation.book_id]
      );

      await connection.query(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
        [reservation.book_id]
      );
    }

    // 3. Mark reservation as CANCELLED
    await connection.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      ['CANCELLED', id]
    );

    await connection.commit();

    return {
      id: Number(id),
      book_id: reservation.book_id,
      status: 'CANCELLED',
      message: 'Reservation cancelled successfully and inventory copy restored'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Approves a pending reservation (Admin only).
 *
 * @param {number|string} id
 * @returns {Promise<Object>} Approved reservation
 */
async function approveReservation(id) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT id, user_id, book_id, status FROM reservations WHERE id = ? FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      throw ApiError.notFound('Reservation not found');
    }

    const reservation = rows[0];

    if (reservation.status === 'APPROVED') {
      throw ApiError.conflict('Reservation is already approved');
    }

    if (reservation.status !== 'PENDING') {
      throw ApiError.conflict(`Cannot approve reservation in '${reservation.status}' status`);
    }

    await connection.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      ['APPROVED', id]
    );

    await connection.commit();

    return {
      id: Number(id),
      user_id: reservation.user_id,
      book_id: reservation.book_id,
      status: 'APPROVED'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createReservation,
  getUserReservations,
  getAllReservations,
  getReservationById,
  cancelReservation,
  approveReservation
};
