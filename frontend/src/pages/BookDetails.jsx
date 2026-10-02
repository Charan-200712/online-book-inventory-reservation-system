import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import bookService from '../services/bookService';
import reservationService from '../services/reservationService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reserving, setReserving] = useState(false);
  const [resSuccess, setResSuccess] = useState('');
  const [resError, setResError] = useState('');

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

  const handleReserve = async () => {
    if (!book) return;

    setReserving(true);
    setResSuccess('');
    setResError('');

    try {
      await reservationService.createReservation(book.id);
      setResSuccess(
        `Successfully placed a hold for "${book.title}"! A copy is reserved for you.`
      );
      // Reload book data to update available_copies
      const updatedBook = await bookService.getBookById(id);
      setBook(updatedBook);
    } catch (err) {
      console.error('Reservation error:', err);
      if (err.status === 409) {
        setResError('You already have an active reservation for this book.');
      } else {
        setResError(err.message || 'Unable to reserve book. Please try again.');
      }
    } finally {
      setReserving(false);
    }
  };

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
                Authored by <strong>{book.author?.name || book.author_name || 'Unknown Author'}</strong>
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

              {/* Reservation Action Box */}
              <div className="reservation-action-panel">
                {resSuccess && (
                  <div className="success-banner" style={{ marginBottom: '1rem' }} role="status">
                    <div>
                      <p>✅ {resSuccess}</p>
                      <Link to="/dashboard" className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                        View in Dashboard &rarr;
                      </Link>
                    </div>
                  </div>
                )}

                {resError && (
                  <div style={{ marginBottom: '1rem' }}>
                    <ErrorMessage message={resError} />
                  </div>
                )}

                {book.available_copies > 0 ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-lg"
                    onClick={handleReserve}
                    disabled={reserving}
                  >
                    {reserving ? 'Reserving Copy...' : '📑 Reserve This Book'}
                  </button>
                ) : (
                  <div className="reservation-notice-box out-of-stock-notice">
                    <p>
                      ⚠️ All copies of this volume are currently held or checked out. Please check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookDetails;
