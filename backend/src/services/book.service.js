const db = require('../config/db');

/**
 * Service function demonstrating relational LEFT JOIN query.
 * Retrieves all books along with their author's name.
 * Books without an assigned author will return author_name as NULL.
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

module.exports = {
  getBooksWithAuthors
};
