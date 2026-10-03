import React, { useState, useEffect } from 'react';

/**
 * Admin Issue Loan Modal
 * Supports issuing books directly (Member + Book) or fulfilling an approved hold reservation.
 */
function AdminIssueModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  books = [],
  members = [],
  prefillReservation = null,
}) {
  const [reservationId, setReservationId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (prefillReservation) {
      setReservationId(prefillReservation.id);
      setSelectedBookId(prefillReservation.book_id || '');
      setSelectedUserId(prefillReservation.user_id || '');
    } else {
      setReservationId('');
      setSelectedBookId('');
      setSelectedUserId('');
    }
    setError('');
  }, [prefillReservation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (reservationId) {
      onSubmit({ reservation_id: Number(reservationId) });
    } else {
      if (!selectedBookId) {
        setError('Please select a book to issue.');
        return;
      }
      if (!selectedUserId) {
        setError('Please select a member to receive the book.');
        return;
      }
      onSubmit({
        book_id: Number(selectedBookId),
        user_id: Number(selectedUserId),
      });
    }
  };

  const availableBooks = books.filter((b) => b.available_copies > 0);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 id="issue-modal-title" className="modal-title">
            {prefillReservation ? 'Fulfill Reservation & Issue Book' : 'Issue Book to Member'}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="modal-error-alert" role="alert" style={{ marginBottom: '1rem' }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            {prefillReservation ? (
              <div className="reservation-terms-card" style={{ marginBottom: '1rem' }}>
                <h5>📋 Fulfilling Approved Hold #{prefillReservation.id}</h5>
                <ul className="terms-list">
                  <li><strong>Book:</strong> {prefillReservation.book_title}</li>
                  <li><strong>Borrower:</strong> {prefillReservation.user_name || `Member #${prefillReservation.user_id}`}</li>
                  <li><strong>Loan Duration:</strong> 14 calendar days from today.</li>
                </ul>
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="issue-book-select" className="form-label">
                    Select Book to Issue *
                  </label>
                  <select
                    id="issue-book-select"
                    className="form-input"
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Book ({availableBooks.length} Available) --</option>
                    {availableBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (Stock: {b.available_copies} of {b.total_copies})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="issue-user-select" className="form-label">
                    Select Member *
                  </label>
                  <select
                    id="issue-user-select"
                    className="form-input"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Registered Member --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="reservation-terms-card">
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ℹ️ Standard checkout policy: 14 days circulation window. A physical copy will be deducted from active shelf stock upon issuance.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Issuing Volume...' : 'Confirm Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminIssueModal;
