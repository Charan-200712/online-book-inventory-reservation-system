import React, { useEffect } from 'react';

/**
 * Translates API / Network / Auth errors into clear, friendly academic feedback messages.
 */
export function formatReservationError(err, bookTitle = 'this book') {
  if (!err) return '';
  if (err.status === 401) {
    return 'Your session has expired or you are not signed in. Please sign in to reserve books.';
  }
  if (err.status === 0 || (err.message && (err.message.includes('connect to the server') || err.message.includes('network')))) {
    return 'Unable to connect to the library server. Please verify your connection and try again.';
  }
  if (err.status === 409) {
    if (err.message && err.message.toLowerCase().includes('already')) {
      return `You already have an active reservation for "${bookTitle}".`;
    }
    if (err.message && err.message.toLowerCase().includes('no available copies')) {
      return `All copies of "${bookTitle}" are currently checked out or reserved.`;
    }
    return err.message || `Unable to reserve "${bookTitle}" due to an existing reservation conflict.`;
  }
  if (err.status === 400 && err.message && err.message.toLowerCase().includes('available')) {
    return `All copies of "${bookTitle}" are currently unavailable.`;
  }
  return err.message || 'An error occurred while processing your reservation. Please try again.';
}

/**
 * Standardized Reservation Confirmation Modal
 * Adheres to the Modern Academic Navy design system.
 */
function ReservationModal({
  isOpen,
  book,
  onConfirm,
  onClose,
  isSubmitting = false,
  error = '',
}) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !book) return null;

  const isAvailable = (book.available_copies || 0) > 0;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="modal-content reservation-modal-content">
        {/* Modal Header */}
        <div className="modal-header">
          <h3 id="reservation-modal-title" className="modal-title">
            Confirm Book Reservation
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close confirmation dialog"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="reservation-modal-body">
          {/* Book Preview Section */}
          <div className="modal-book-preview">
            <div className="modal-book-cover" aria-hidden="true">
              <span className="modal-book-cover-icon">📘</span>
              <span className="modal-book-cover-cat">{book.category || 'General'}</span>
            </div>

            <div className="modal-book-info">
              <span className="category-pill">{book.category || 'General'}</span>
              <h4 className="modal-book-title">{book.title}</h4>
              <p className="modal-book-author">
                By <strong>{book.author_name || book.author?.name || 'Unknown Author'}</strong>
              </p>
              <div className="modal-book-stock">
                <span className="text-secondary text-sm">ISBN: <span className="font-mono">{book.isbn}</span></span>
                <span
                  className={`stock-badge ${isAvailable ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                  style={{ marginTop: '0.35rem' }}
                >
                  {isAvailable ? `${book.available_copies} of ${book.total_copies} Copies Available` : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>

          {/* Reservation Policy Information */}
          <div className="reservation-terms-card">
            <h5>📋 Departmental Reservation Terms</h5>
            <ul className="terms-list">
              <li>
                <strong>Single Physical Copy:</strong> A physical volume will be assigned to your account upon administrator approval.
              </li>
              <li>
                <strong>Pickup Window:</strong> Approved holds are kept at the circulation desk for <strong>3 business days</strong>.
              </li>
              <li>
                <strong>Circulation Period:</strong> Standard loan duration is <strong>14 days</strong> from physical issuance.
              </li>
            </ul>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="modal-error-alert" role="alert">
              <span>⚠️ {error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isSubmitting || !isAvailable}
          >
            {isSubmitting ? 'Confirming Hold...' : 'Confirm Reservation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReservationModal;
