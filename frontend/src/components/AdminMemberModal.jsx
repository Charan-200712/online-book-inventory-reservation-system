import React from 'react';

/**
 * Admin Member Details Modal
 * Displays member details, current reservations, active loans, and circulation history.
 */
function AdminMemberModal({
  isOpen,
  onClose,
  member,
  reservations = [],
  transactions = [],
}) {
  if (!isOpen || !member) return null;

  const userReservations = reservations.filter((r) => r.user_id === member.id);
  const userTransactions = transactions.filter((t) => t.user_id === member.id);

  const activeLoans = userTransactions.filter(
    (t) => t.status === 'ISSUED' || t.status === 'OVERDUE'
  );
  const returnedHistory = userTransactions.filter((t) => t.status === 'RETURNED');

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>👤</span>
            <div>
              <h3 id="member-modal-title" className="modal-title">
                {member.name}
              </h3>
              <p className="text-secondary text-sm" style={{ margin: 0 }}>
                {member.email} &bull; Joined {formatDate(member.created_at)}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Quick Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <div className="metric-box" style={{ padding: '0.75rem' }}>
              <span className="metric-number" style={{ fontSize: '1.3rem' }}>
                {userReservations.length}
              </span>
              <span className="metric-label" style={{ fontSize: '0.72rem' }}>
                Total Reservations
              </span>
            </div>
            <div className="metric-box" style={{ padding: '0.75rem' }}>
              <span className="metric-number text-primary" style={{ fontSize: '1.3rem' }}>
                {activeLoans.length}
              </span>
              <span className="metric-label" style={{ fontSize: '0.72rem' }}>
                Active Loans
              </span>
            </div>
            <div className="metric-box" style={{ padding: '0.75rem' }}>
              <span className="metric-number text-success" style={{ fontSize: '1.3rem' }}>
                {returnedHistory.length}
              </span>
              <span className="metric-label" style={{ fontSize: '0.72rem' }}>
                Returned Books
              </span>
            </div>
          </div>

          {/* Section: Active Loans */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h5 style={{ fontSize: '0.88rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>
              📖 Active Borrowings ({activeLoans.length})
            </h5>
            {activeLoans.length === 0 ? (
              <p className="text-secondary text-sm" style={{ fontStyle: 'italic', margin: 0 }}>
                No active books currently on loan.
              </p>
            ) : (
              <table className="admin-table text-sm">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td><strong>{loan.book_title}</strong></td>
                      <td>{formatDate(loan.due_date)}</td>
                      <td>
                        <span
                          className={`badge ${
                            loan.status === 'OVERDUE' ? 'badge-cancelled' : 'badge-in-stock'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section: Reservations */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h5 style={{ fontSize: '0.88rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>
              📑 Reservation Holds ({userReservations.length})
            </h5>
            {userReservations.length === 0 ? (
              <p className="text-secondary text-sm" style={{ fontStyle: 'italic', margin: 0 }}>
                No reservation holds on record.
              </p>
            ) : (
              <table className="admin-table text-sm">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Reserved Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userReservations.map((res) => (
                    <tr key={res.id}>
                      <td><strong>{res.book_title}</strong></td>
                      <td>{formatDate(res.reservation_date)}</td>
                      <td>
                        <span
                          className={`badge ${
                            res.status === 'APPROVED'
                              ? 'badge-in-stock'
                              : res.status === 'PENDING'
                              ? 'badge-pending'
                              : res.status === 'CANCELLED'
                              ? 'badge-cancelled'
                              : 'badge-completed'
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section: Returned Loan History */}
          <div>
            <h5 style={{ fontSize: '0.88rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>
              📜 Loan History ({returnedHistory.length})
            </h5>
            {returnedHistory.length === 0 ? (
              <p className="text-secondary text-sm" style={{ fontStyle: 'italic', margin: 0 }}>
                No past circulation history.
              </p>
            ) : (
              <table className="admin-table text-sm">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Issued Date</th>
                    <th>Return Date</th>
                  </tr>
                </thead>
                <tbody>
                  {returnedHistory.slice(0, 5).map((h) => (
                    <tr key={h.id}>
                      <td><strong>{h.book_title}</strong></td>
                      <td>{formatDate(h.issue_date)}</td>
                      <td>{formatDate(h.return_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminMemberModal;
