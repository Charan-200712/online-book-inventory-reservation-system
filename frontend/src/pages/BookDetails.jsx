import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import bookService from '../services/bookService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBook = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookService.getBookById(id);
      setBook(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve book details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBook();
  }, [id]);

  if (loading) {
    return <Loading message="Loading book details..." />;
  }

  return (
    <div className="page-container">
      <div className="breadcrumb-nav">
        <Link to="/books" className="back-link">
          &larr; Back to Books Catalog
        </Link>
      </div>

      <ErrorMessage message={error} onRetry={loadBook} />

      {!loading && !error && book && (
        <div className="book-details-card">
          <div className="details-header">
            <div className="details-title-group">
              <span className="category-pill">{book.category || 'General'}</span>
              <h1 className="details-title">{book.title}</h1>
              <p className="details-author">
                Authored by <strong>{book.author_name || 'Unknown Author'}</strong>
              </p>
            </div>
            <div className="details-status-badge">
              <span
                className={`stock-badge stock-badge-lg ${
                  book.available_copies > 0 ? 'badge-in-stock' : 'badge-out-of-stock'
                }`}
              >
                {book.available_copies > 0 ? 'Available' : 'Currently Unavailable'}
              </span>
            </div>
          </div>

          <div className="details-grid">
            <div className="details-main">
              <h3>Description</h3>
              <p className="book-description">
                {book.description || 'No detailed description available for this volume.'}
              </p>
            </div>

            <div className="details-sidebar">
              <h3>Inventory Information</h3>
              <ul className="info-list">
                <li>
                  <span className="info-label">ISBN:</span>
                  <span className="info-value font-mono">{book.isbn}</span>
                </li>
                <li>
                  <span className="info-label">Total Copies:</span>
                  <span className="info-value">{book.total_copies}</span>
                </li>
                <li>
                  <span className="info-label">Available Copies:</span>
                  <span className="info-value">
                    <strong>{book.available_copies}</strong> / {book.total_copies}
                  </span>
                </li>
                <li>
                  <span className="info-label">Category:</span>
                  <span className="info-value">{book.category}</span>
                </li>
                <li>
                  <span className="info-label">Cataloged On:</span>
                  <span className="info-value">
                    {book.created_at ? new Date(book.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </li>
              </ul>

              <div className="reservation-notice-box">
                <p>
                  <strong>Note:</strong> Online reservation submission workflows will be activated in an upcoming phase.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookDetails;
