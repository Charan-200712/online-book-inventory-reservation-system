import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reservationService from '../services/reservationService';
import transactionService from '../services/transactionService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function Dashboard() {
  const { user } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' | 'loans' | 'history'

  // Data states
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // User feedback banner
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Load dashboard data (reservations and circulation history)
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setFeedback((prev) => ({ ...prev, error: '' }));

    try {
      const [userReservations, userTransactions] = await Promise.all([
        reservationService.getMyReservations(),
        transactionService.getMyTransactions(),
      ]);

      setReservations(userReservations || []);
      setTransactions(userTransactions || []);
    } catch (err) {
      console.error('Dashboard data load error:', err);
      setFeedback((prev) => ({
        ...prev,
        error: err.message || 'Unable to retrieve dashboard information. Please try again.',
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle reservation cancellation
  const handleCancelReservation = async (reservationId, bookTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your reservation for "${bookTitle}"?`
    );
    if (!confirmed) return;

    setCancellingId(reservationId);
    setFeedback({ error: '', success: '' });

    try {
      const res = await reservationService.cancelReservation(reservationId);
      setFeedback({
        error: '',
        success: res.message || 'Reservation cancelled successfully and inventory copy restored.',
      });
      // Refresh without full page reload
      await loadDashboardData(true);
    } catch (err) {
      console.error('Reservation cancellation failed:', err);
      setFeedback({
        error: err.message || 'Failed to cancel reservation. Please check its current status.',
        success: '',
      });
    } finally {
      setCancellingId(null);
    }
  };

  // Helper: Format date strings
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  };

  // Helper: Compute pickup deadline for approved holds
  const getPickupDeadline = (reservationDate, status) => {
    if (status === 'APPROVED') {
      const d = new Date(reservationDate);
      if (!isNaN(d.getTime())) {
        const pickupDate = new Date(d.getTime() + 3 * 24 * 60 * 60 * 1000);
        return `Pickup by ${pickupDate.toLocaleDateString()}`;
      }
      return 'Pickup within 3 days';
    }
    if (status === 'PENDING') return 'Awaiting Admin Approval';
    if (status === 'COMPLETED') return 'Fulfilled (Issued to Loan)';
    if (status === 'CANCELLED') return 'Hold Cancelled';
    return '—';
  };

  // Filter Active Loans vs Completed History
  const activeLoans = useMemo(() => {
    return transactions.filter((t) => t.status === 'ISSUED' || t.status === 'OVERDUE');
  }, [transactions]);

  // Compute Statistics
  const now = new Date();
  const activeHolds = useMemo(() => {
    return reservations.filter(
      (r) => r.status === 'PENDING' || r.status === 'APPROVED'
    ).length;
  }, [reservations]);

  const currentlyIssued = activeLoans.length;

  const dueSoonCount = useMemo(() => {
    return activeLoans.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      if (isNaN(due.getTime())) return false;
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    }).length;
  }, [activeLoans, now]);

  // Combined History (Returned Loans + Completed/Cancelled Reservations)
  const historyRecords = useMemo(() => {
    const list = [];

    // Returned loan transactions
    transactions
      .filter((t) => t.status === 'RETURNED')
      .forEach((t) => {
        list.push({
          id: `tx-${t.id}`,
          book_id: t.book_id,
          book_title: t.book_title,
          book_isbn: t.book_isbn,
          author_name: t.author_name,
          date: t.return_date || t.issue_date,
          type: 'Circulation Loan Returned',
          status: 'RETURNED',
        });
      });

    // Completed or Cancelled holds
    reservations
      .filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED')
      .forEach((r) => {
        list.push({
          id: `res-${r.id}`,
          book_id: r.book_id,
          book_title: r.book_title,
          book_isbn: r.book_isbn,
          author_name: r.author_name,
          date: r.reservation_date,
          type: r.status === 'COMPLETED' ? 'Hold Fulfilled (Issued)' : 'Reservation Hold Cancelled',
          status: r.status,
        });
      });

    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [transactions, reservations]);

  if (loading) {
    return <Loading message="Loading your library account &amp; circulation records..." />;
  }

  return (
    <div className="page-container dashboard-container">
      {/* 1. TOP HEADER SECTION */}
      <div className="page-header dashboard-header">
        <div>
          <h1 className="page-title">My Library</h1>
          <p className="page-subtitle">
            Manage your reservations, loans and reading activity.
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {feedback.error && (
        <ErrorMessage message={feedback.error} onRetry={() => loadDashboardData(true)} />
      )}
      {feedback.success && (
        <div className="success-banner" role="status">
          <span>✅ {feedback.success}</span>
        </div>
      )}

      {/* 2. PROFILE SUMMARY & 4 REAL METRICS */}
      <div className="my-library-overview-grid">
        {/* Profile Summary Card */}
        <div className="profile-summary-card">
          <div className="profile-card-header">
            <span className="profile-avatar" aria-hidden="true">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <div className="profile-titles">
              <h2 className="profile-name">{user?.name}</h2>
              <span className="profile-email">{user?.email}</span>
            </div>
            <span
              className={`badge ${user?.role === 'ADMIN' ? 'badge-admin' : 'badge-in-stock'}`}
            >
              {user?.role === 'ADMIN' ? 'Administrator' : 'Department Member'}
            </span>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Account Role:</span>
              <span className="detail-value font-semibold">
                {user?.role === 'ADMIN' ? 'Librarian / Administrator' : 'Student / Faculty'}
              </span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Library Member ID:</span>
              <span className="detail-value font-mono">#{user?.id}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Lending Privileges:</span>
              <span className="detail-value text-success font-semibold">Active &bull; Good Standing</span>
            </div>
          </div>
        </div>

        {/* 4 Statistics Cards */}
        <div className="my-library-stats-grid">
          <div className="metric-box stat-card">
            <span className="metric-icon">📑</span>
            <div className="metric-info">
              <span className="metric-number">{activeHolds}</span>
              <span className="metric-label">Active Reservations</span>
            </div>
          </div>

          <div className="metric-box stat-card">
            <span className="metric-icon">📖</span>
            <div className="metric-info">
              <span className="metric-number">{currentlyIssued}</span>
              <span className="metric-label">Books on Loan</span>
            </div>
          </div>

          <div className="metric-box stat-card">
            <span className="metric-icon">⏳</span>
            <div className="metric-info">
              <span className={`metric-number ${dueSoonCount > 0 ? 'text-warning' : ''}`}>
                {dueSoonCount}
              </span>
              <span className="metric-label">Due Soon / Overdue</span>
            </div>
          </div>

          <div className="metric-box stat-card">
            <span className="metric-icon">📚</span>
            <div className="metric-info">
              <span className="metric-number">{reservations.length}</span>
              <span className="metric-label">Total Reservations</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="my-library-tabs" role="tablist" aria-label="Library Activity Tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reservations'}
          className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📑 Reservations ({reservations.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'loans'}
          className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          📖 Active Loans ({activeLoans.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📂 Reading History ({historyRecords.length})
        </button>
      </div>

      {/* 4. TAB 1: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <section className="dashboard-section" aria-labelledby="reservations-tab-heading">
          <div className="section-header">
            <div>
              <h2 id="reservations-tab-heading" className="section-title">
                My Book Reservations
              </h2>
              <p className="text-muted text-sm">
                Track hold requests, approval confirmations, and pickup deadlines.
              </p>
            </div>
            <Link to="/books" className="btn btn-primary btn-sm">
              + Reserve More Books
            </Link>
          </div>

          {reservations.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">📭</span>
              <h3>No Active Reservations</h3>
              <p>You do not have any book holds placed in the system right now.</p>
              <Link to="/books" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                Explore Books to Reserve
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Reserved Date</th>
                    <th>Status</th>
                    <th>Expiry / Pickup Window</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => {
                    const isCancelable = res.status === 'PENDING';
                    return (
                      <tr key={res.id}>
                        <td>
                          <div className="table-book-info">
                            <Link to={`/books/${res.book_id}`} className="table-book-title">
                              {res.book_title}
                            </Link>
                            <span className="table-book-sub">
                              By {res.author_name || 'Unknown Author'} &bull; ISBN: <span className="font-mono">{res.book_isbn}</span>
                            </span>
                          </div>
                        </td>
                        <td>{formatDate(res.reservation_date)}</td>
                        <td>
                          <span className={`status-badge status-${res.status.toLowerCase()}`}>
                            {res.status}
                          </span>
                        </td>
                        <td>
                          <span className={`pickup-info-text ${res.status === 'APPROVED' ? 'text-success font-semibold' : 'text-muted'}`}>
                            {getPickupDeadline(res.reservation_date, res.status)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {isCancelable ? (
                              <button
                                type="button"
                                className="btn btn-danger-outline btn-sm"
                                onClick={() => handleCancelReservation(res.id, res.book_title)}
                                disabled={cancellingId === res.id}
                              >
                                {cancellingId === res.id ? 'Cancelling...' : 'Cancel Hold'}
                              </button>
                            ) : (
                              <span className="text-muted text-sm">—</span>
                            )}
                            <Link to={`/books/${res.book_id}`} className="btn btn-outline btn-sm">
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 5. TAB 2: ACTIVE LOANS */}
      {activeTab === 'loans' && (
        <section className="dashboard-section" aria-labelledby="loans-tab-heading">
          <div className="section-header">
            <div>
              <h2 id="loans-tab-heading" className="section-title">
                Active Books on Loan
              </h2>
              <p className="text-muted text-sm">
                Volumes currently in your possession with 14-day circulation due dates.
              </p>
            </div>
            <span className="section-count">
              {activeLoans.length} {activeLoans.length === 1 ? 'volume checked out' : 'volumes checked out'}
            </span>
          </div>

          {activeLoans.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">📖</span>
              <h3>No Books on Loan</h3>
              <p>You do not have any borrowed books in your possession currently.</p>
              <Link to="/books" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                Browse Catalog &rarr;
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Issued Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Circulation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((tx) => {
                    const isOverdue = tx.status === 'OVERDUE';
                    return (
                      <tr key={tx.id}>
                        <td>
                          <div className="table-book-info">
                            <Link to={`/books/${tx.book_id}`} className="table-book-title">
                              {tx.book_title}
                            </Link>
                            <span className="table-book-sub">
                              By {tx.author_name || 'Unknown'} &bull; ISBN: <span className="font-mono">{tx.book_isbn}</span>
                            </span>
                          </div>
                        </td>
                        <td>{formatDate(tx.issue_date)}</td>
                        <td>
                          <span className={isOverdue ? 'text-danger font-semibold' : ''}>
                            {formatDate(tx.due_date)} {isOverdue && '(Overdue)'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${tx.status.toLowerCase()}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              alert(
                                `Renewal request noted for "${tx.book_title}". Standard departmental lending period is 14 days. Please return or verify with the circulation desk.`
                              )
                            }
                            title="Request a loan renewal from departmental library staff"
                          >
                            🔄 Renew
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 6. TAB 3: READING HISTORY */}
      {activeTab === 'history' && (
        <section className="dashboard-section" aria-labelledby="history-tab-heading">
          <div className="section-header">
            <div>
              <h2 id="history-tab-heading" className="section-title">
                Circulation &amp; Reading History
              </h2>
              <p className="text-muted text-sm">
                Chronological record of previously returned loans, fulfilled holds, and closed transactions.
              </p>
            </div>
            <span className="section-count">
              {historyRecords.length} {historyRecords.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {historyRecords.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">📂</span>
              <h3>No Past Activity Recorded</h3>
              <p>You have not completed any borrowing cycles or closed reservations yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Transaction Date</th>
                    <th>Transaction Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="table-book-info">
                          <Link to={`/books/${item.book_id}`} className="table-book-title">
                            {item.book_title}
                          </Link>
                          <span className="table-book-sub">
                            By {item.author_name || 'Unknown'} &bull; ISBN: <span className="font-mono">{item.book_isbn}</span>
                          </span>
                        </div>
                      </td>
                      <td>{formatDate(item.date)}</td>
                      <td>
                        <span className="text-sm font-medium">{item.type}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Dashboard;
