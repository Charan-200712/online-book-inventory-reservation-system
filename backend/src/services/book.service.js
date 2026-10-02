const db = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Service function demonstrating relational LEFT JOIN query (backward compatibility).
 *
 * @returns {Promise<Array>} List of books with author information
 */
async function getBooksWithAuthors() {
  const query = `
    SELECT
        b.id,
        b.title,
        b.isbn,
        b.total_copies,
        b.available_copies,
        a.name AS author_name
    FROM books b
    LEFT JOIN authors a
        ON b.author_id = a.id;
  `;

  const [rows] = await db.query(query);
  return rows;
}

/**
 * Creates a new book record (Admin only).
 *
 * @param {Object} bookData
 * @param {string} bookData.title
 * @param {string} bookData.isbn
 * @param {number} bookData.author_id
 * @param {string} [bookData.category]
 * @param {number} bookData.total_copies
 * @param {string} [bookData.description]
 * @returns {Promise<Object>} Created book
 */
async function createBook({ title, isbn, author_id, category, total_copies, description }) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw ApiError.badRequest('Book title is required');
  }

  if (!isbn || typeof isbn !== 'string' || !isbn.trim()) {
    throw ApiError.badRequest('ISBN is required');
  }

  if (author_id === undefined || author_id === null || isNaN(Number(author_id))) {
    throw ApiError.badRequest('Valid author_id is required');
  }

  if (total_copies === undefined || total_copies === null || isNaN(Number(total_copies))) {
    throw ApiError.badRequest('total_copies is required and must be a number');
  }

  const totalCopiesNum = parseInt(total_copies, 10);
  if (totalCopiesNum < 0) {
    throw ApiError.badRequest('total_copies must be greater than or equal to 0');
  }

  const trimmedTitle = title.trim();
  const trimmedIsbn = isbn.trim();
  const trimmedCategory = category && typeof category === 'string' ? category.trim() : 'General';
  const desc = description && typeof description === 'string' ? description.trim() : null;

  // Verify author exists
  const [authors] = await db.query('SELECT id, name FROM authors WHERE id = ? LIMIT 1', [author_id]);
  if (authors.length === 0) {
    throw ApiError.badRequest(`Referenced author with ID ${author_id} does not exist`);
  }

  // Check unique ISBN
  const [existingIsbn] = await db.query('SELECT id FROM books WHERE isbn = ? LIMIT 1', [trimmedIsbn]);
  if (existingIsbn.length > 0) {
    throw ApiError.conflict(`A book with ISBN '${trimmedIsbn}' already exists`);
  }

  // available_copies initially equals total_copies
  const availableCopiesNum = totalCopiesNum;

  const [result] = await db.query(
    `INSERT INTO books (title, isbn, author_id, category, total_copies, available_copies, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [trimmedTitle, trimmedIsbn, author_id, trimmedCategory, totalCopiesNum, availableCopiesNum, desc]
  );

  return {
    id: result.insertId,
    title: trimmedTitle,
    isbn: trimmedIsbn,
    author_id: Number(author_id),
    author_name: authors[0].name,
    category: trimmedCategory,
    total_copies: totalCopiesNum,
    available_copies: availableCopiesNum,
    description: desc
  };
}

/**
 * Retrieves all books with relational LEFT JOIN to authors.
 * Supports optional availability filter and pagination.
 *
 * @param {Object} [filterOptions]
 * @param {string} [filterOptions.available] - 'true' or 'false'
 * @param {number|string} [filterOptions.page]
 * @param {number|string} [filterOptions.limit]
 * @returns {Promise<{ books: Array, pagination?: Object }>}
 */
async function getAllBooks({ available, page, limit } = {}) {
  let whereClause = '';
  const queryParams = [];

  if (available === 'true') {
    whereClause = 'WHERE b.available_copies > 0';
  } else if (available === 'false') {
    whereClause = 'WHERE b.available_copies = 0';
  }

  // Check total count for pagination
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM books b ${whereClause}`,
    queryParams
  );
  const total = countRows[0].total;

  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
  const limitNum = limit ? Math.max(1, parseInt(limit, 10) || 10) : total || 10;
  const offset = (pageNum - 1) * limitNum;

  const selectQuery = `
    SELECT
        b.id,
        b.title,
        b.isbn,
        b.category,
        b.total_copies,
        b.available_copies,
        b.description,
        b.created_at,
        b.updated_at,
        a.id AS author_id,
        a.name AS author_name
    FROM books b
    LEFT JOIN authors a
        ON b.author_id = a.id
    ${whereClause}
    ORDER BY b.title ASC
    LIMIT ? OFFSET ?;
  `;

  const [books] = await db.query(selectQuery, [...queryParams, limitNum, offset]);

  return {
    books,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Live search across title, ISBN, author name, and category.
 *
 * @param {string} searchQuery
 * @returns {Promise<Array>} Matching books
 */
async function searchBooks(searchQuery) {
  if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
    return [];
  }

  const term = `%${searchQuery.trim()}%`;

  const query = `
    SELECT
        b.id,
        b.title,
        b.isbn,
        b.category,
        b.total_copies,
        b.available_copies,
        b.description,
        b.created_at,
        b.updated_at,
        a.id AS author_id,
        a.name AS author_name
    FROM books b
    LEFT JOIN authors a
        ON b.author_id = a.id
    WHERE
        b.title LIKE ?
        OR b.isbn LIKE ?
        OR a.name LIKE ?
        OR b.category LIKE ?
    ORDER BY b.title ASC;
  `;

  const [books] = await db.query(query, [term, term, term, term]);
  return books;
}

/**
 * Retrieves a book by ID with detailed author and availability data.
 *
 * @param {number|string} id - Book ID
 * @returns {Promise<Object>} Formatted book object
 */
async function getBookById(id) {
  const query = `
    SELECT
        b.id,
        b.title,
        b.isbn,
        b.author_id,
        b.category,
        b.total_copies,
        b.available_copies,
        b.description,
        b.created_at,
        b.updated_at,
        a.name AS author_name
    FROM books b
    LEFT JOIN authors a
        ON b.author_id = a.id
    WHERE b.id = ?
    LIMIT 1;
  `;

  const [rows] = await db.query(query, [id]);
  if (rows.length === 0) {
    throw ApiError.notFound('Book not found');
  }

  const b = rows[0];

  return {
    id: b.id,
    title: b.title,
    isbn: b.isbn,
    author: b.author_id ? { id: b.author_id, name: b.author_name } : null,
    category: b.category,
    total_copies: b.total_copies,
    available_copies: b.available_copies,
    description: b.description,
    created_at: b.created_at,
    updated_at: b.updated_at
  };
}

/**
 * Updates a book with inventory adjustment integrity (Admin only).
 *
 * @param {number|string} id - Book ID
 * @param {Object} updateData
 * @returns {Promise<Object>} Updated book
 */
async function updateBook(id, updateData) {
  const [existing] = await db.query('SELECT * FROM books WHERE id = ? LIMIT 1', [id]);
  if (existing.length === 0) {
    throw ApiError.notFound('Book not found');
  }

  const current = existing[0];
  let newTitle = current.title;
  let newIsbn = current.isbn;
  let newAuthorId = current.author_id;
  let newCategory = current.category;
  let newTotalCopies = current.total_copies;
  let newAvailableCopies = current.available_copies;
  let newDescription = current.description;

  if (updateData.title !== undefined) {
    if (!updateData.title || typeof updateData.title !== 'string' || !updateData.title.trim()) {
      throw ApiError.badRequest('Book title cannot be empty');
    }
    newTitle = updateData.title.trim();
  }

  if (updateData.isbn !== undefined) {
    if (!updateData.isbn || typeof updateData.isbn !== 'string' || !updateData.isbn.trim()) {
      throw ApiError.badRequest('ISBN cannot be empty');
    }
    const trimmedIsbn = updateData.isbn.trim();
    if (trimmedIsbn !== current.isbn) {
      const [duplicate] = await db.query(
        'SELECT id FROM books WHERE isbn = ? AND id != ? LIMIT 1',
        [trimmedIsbn, id]
      );
      if (duplicate.length > 0) {
        throw ApiError.conflict(`Another book already exists with ISBN '${trimmedIsbn}'`);
      }
      newIsbn = trimmedIsbn;
    }
  }

  if (updateData.author_id !== undefined) {
    if (updateData.author_id !== null) {
      const [authorCheck] = await db.query('SELECT id FROM authors WHERE id = ? LIMIT 1', [updateData.author_id]);
      if (authorCheck.length === 0) {
        throw ApiError.badRequest(`Referenced author with ID ${updateData.author_id} does not exist`);
      }
      newAuthorId = updateData.author_id;
    } else {
      newAuthorId = null;
    }
  }

  if (updateData.category !== undefined) {
    newCategory = updateData.category ? updateData.category.trim() : 'General';
  }

  if (updateData.description !== undefined) {
    newDescription = updateData.description ? updateData.description.trim() : null;
  }

  // Inventory adjustment rule
  if (updateData.total_copies !== undefined) {
    const requestedTotal = parseInt(updateData.total_copies, 10);
    if (isNaN(requestedTotal) || requestedTotal < 0) {
      throw ApiError.badRequest('total_copies must be a valid non-negative integer');
    }

    const currentlyIssued = current.total_copies - current.available_copies;
    if (requestedTotal < currentlyIssued) {
      throw ApiError.badRequest(
        `Cannot reduce total copies to ${requestedTotal}. There are currently ${currentlyIssued} copy(ies) issued to users.`
      );
    }

    const difference = requestedTotal - current.total_copies;
    newTotalCopies = requestedTotal;
    newAvailableCopies = current.available_copies + difference;

    if (newAvailableCopies < 0 || newAvailableCopies > newTotalCopies) {
      throw ApiError.badRequest('Resulting available copies would violate inventory bounds');
    }
  }

  await db.query(
    `UPDATE books
     SET title = ?, isbn = ?, author_id = ?, category = ?, total_copies = ?, available_copies = ?, description = ?
     WHERE id = ?`,
    [newTitle, newIsbn, newAuthorId, newCategory, newTotalCopies, newAvailableCopies, newDescription, id]
  );

  return getBookById(id);
}

/**
 * Deletes a book after checking for active references in reservations or transactions.
 *
 * @param {number|string} id - Book ID
 * @returns {Promise<{ message: string }>}
 */
async function deleteBook(id) {
  const [existing] = await db.query('SELECT id, title FROM books WHERE id = ? LIMIT 1', [id]);
  if (existing.length === 0) {
    throw ApiError.notFound('Book not found');
  }

  // Check for foreign key references in reservations
  const [resCount] = await db.query('SELECT COUNT(*) AS count FROM reservations WHERE book_id = ?', [id]);
  if (resCount[0].count > 0) {
    throw ApiError.conflict(
      `Cannot delete book '${existing[0].title}' because it has ${resCount[0].count} associated reservation record(s).`
    );
  }

  // Check for foreign key references in transactions
  const [txCount] = await db.query('SELECT COUNT(*) AS count FROM transactions WHERE book_id = ?', [id]);
  if (txCount[0].count > 0) {
    throw ApiError.conflict(
      `Cannot delete book '${existing[0].title}' because it has ${txCount[0].count} historical borrowing transaction(s).`
    );
  }

  await db.query('DELETE FROM books WHERE id = ?', [id]);

  return { message: 'Book deleted successfully' };
}

module.exports = {
  getBooksWithAuthors,
  createBook,
  getAllBooks,
  searchBooks,
  getBookById,
  updateBook,
  deleteBook
};
