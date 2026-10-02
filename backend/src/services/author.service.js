const db = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Creates a new author in the database.
 *
 * @param {Object} authorData
 * @param {string} authorData.name
 * @param {string} [authorData.biography]
 * @returns {Promise<{ id: number, name: string, biography: string|null }>}
 */
async function createAuthor({ name, biography }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('Author name is required');
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 100) {
    throw ApiError.badRequest('Author name cannot exceed 100 characters');
  }

  const bio = biography && typeof biography === 'string' ? biography.trim() : null;

  const [result] = await db.query(
    'INSERT INTO authors (name, biography) VALUES (?, ?)',
    [trimmedName, bio]
  );

  return {
    id: result.insertId,
    name: trimmedName,
    biography: bio
  };
}

/**
 * Retrieves all authors sorted alphabetically by name.
 *
 * @returns {Promise<Array>} List of authors
 */
async function getAllAuthors() {
  const [authors] = await db.query(
    'SELECT id, name, biography, created_at FROM authors ORDER BY name ASC'
  );
  return authors;
}

/**
 * Retrieves an author by ID, including their associated books.
 *
 * @param {number|string} id - Author ID
 * @returns {Promise<Object>} Author with associated books
 */
async function getAuthorById(id) {
  const [authors] = await db.query(
    'SELECT id, name, biography, created_at FROM authors WHERE id = ? LIMIT 1',
    [id]
  );

  if (authors.length === 0) {
    throw ApiError.notFound('Author not found');
  }

  const author = authors[0];

  const [books] = await db.query(
    'SELECT id, title, isbn, category, total_copies, available_copies FROM books WHERE author_id = ? ORDER BY title ASC',
    [id]
  );

  return {
    ...author,
    books
  };
}

/**
 * Updates an author's name and/or biography.
 *
 * @param {number|string} id - Author ID
 * @param {Object} updateData
 * @param {string} [updateData.name]
 * @param {string} [updateData.biography]
 * @returns {Promise<Object>} Updated author
 */
async function updateAuthor(id, { name, biography }) {
  const [existing] = await db.query(
    'SELECT id, name, biography FROM authors WHERE id = ? LIMIT 1',
    [id]
  );

  if (existing.length === 0) {
    throw ApiError.notFound('Author not found');
  }

  const current = existing[0];
  let newName = current.name;
  let newBio = current.biography;

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('Author name cannot be empty');
    }
    const trimmed = name.trim();
    if (trimmed.length > 100) {
      throw ApiError.badRequest('Author name cannot exceed 100 characters');
    }
    newName = trimmed;
  }

  if (biography !== undefined) {
    newBio = biography && typeof biography === 'string' ? biography.trim() : null;
  }

  await db.query(
    'UPDATE authors SET name = ?, biography = ? WHERE id = ?',
    [newName, newBio, id]
  );

  return {
    id: Number(id),
    name: newName,
    biography: newBio
  };
}

/**
 * Deletes an author by ID after verifying no books reference this author.
 *
 * @param {number|string} id - Author ID
 * @returns {Promise<{ message: string }>}
 */
async function deleteAuthor(id) {
  const [existing] = await db.query(
    'SELECT id, name FROM authors WHERE id = ? LIMIT 1',
    [id]
  );

  if (existing.length === 0) {
    throw ApiError.notFound('Author not found');
  }

  // Prevent foreign key issues: check if books reference this author
  const [bookRef] = await db.query(
    'SELECT COUNT(*) AS book_count FROM books WHERE author_id = ?',
    [id]
  );

  if (bookRef[0].book_count > 0) {
    throw ApiError.conflict(
      `Cannot delete author '${existing[0].name}' because ${bookRef[0].book_count} book(s) reference this author. Reassign or delete associated books first.`
    );
  }

  await db.query('DELETE FROM authors WHERE id = ?', [id]);

  return { message: 'Author deleted successfully' };
}

module.exports = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor
};
