import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  const loadBooks = async (filter = availabilityFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await bookService.getBooks({
        available: filter,
      });
      setBooks(data.books || []);
    } catch (err) {
      setError(err.message || 'Unable to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks(availabilityFilter);
  }, [availabilityFilter]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Book Inventory</h1>
          <p className="page-subtitle">
            Browse our departmental collection, monitor stock availability, and check details.
          </p>
        </div>

        {/* Filter & Search Bar Preparation Container (Phase 8 integration slot) */}
        <div className="catalog-toolbar">
          <div className="search-placeholder-slot" id="search-slot">
            {/* Phase 8 Live Search Component will be mounted here */}
          </div>

          <div className="filter-group">
            <label htmlFor="availability-filter" className="filter-label">Filter Stock:</label>
            <select
              id="availability-filter"
              className="form-select"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="">All Books</option>
              <option value="true">Available Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <Loading message="Loading book inventory..." />}

      <ErrorMessage message={error} onRetry={() => loadBooks(availabilityFilter)} />

      {!loading && !error && books.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No Books Found</h3>
          <p>There are currently no books matching the selected criteria.</p>
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        <div className="books-grid">
          {books.map((book) => {
            const isAvailable = book.available_copies > 0;
            return (
              <div key={book.id} className="book-card">
                <div className="book-card-header">
                  <span className="category-pill">{book.category || 'General'}</span>
                  <span
                    className={`stock-badge ${isAvailable ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                  >
                    {isAvailable ? `${book.available_copies} Available` : 'Unavailable'}
                  </span>
                </div>

                <div className="book-card-body">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">By {book.author_name || 'Unknown Author'}</p>
                  <div className="book-meta">
                    <span className="meta-item">
                      <strong>ISBN:</strong> {book.isbn}
                    </span>
                    <span className="meta-item">
                      <strong>Total Copies:</strong> {book.total_copies}
                    </span>
                  </div>
                </div>

                <div className="book-card-footer">
                  <Link to={`/books/${book.id}`} className="btn btn-outline btn-block">
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Books;
