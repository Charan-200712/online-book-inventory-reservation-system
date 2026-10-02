import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reservationService from '../services/reservationService';
import transactionService from '../services/transactionService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function Dashboard() {
  const { user } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

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

  // Quick stats
  const activeHolds = reservations.filter(
    (r) => r.status === 'PENDING' || r.status === 'APPROVED'
  ).length;
  const currentlyIssued = transactions.filter(
    (t) => t.status === 'ISSUED' || t.status === 'OVERDUE'
  ).length;

  if (loading) {
    return <Loading message="Loading your library dashboard..." />;
  }

  return (
    <div className="page-container dashboard-container">
      {/* Dashboard Top Header */}
      <div className="page-header dashboard-header">
        <div>
          <h1 className="page-title">Member Dashboard</h1>
          <p className="page-subtitle">
            Manage your personal profile, active book reservations, and borrowing circulation history.
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

      {/* Profile & Metric Cards Overview */}
      <div className="dashboard-overview-grid">
        <div className="profile-card">
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
              {user?.role}
            </span>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Account Role:</span>
              <span className="detail-value">{user?.role === 'ADMIN' ? 'Administrator' : 'Standard Member'}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Member ID:</span>
              <span className="detail-value font-mono">#{user?.id}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-metrics-card">
          <div className="metric-box">
            <span className="metric-icon">📑</span>
            <div className="metric-info">
              <span className="metric-number">{activeHolds}</span>
              <span className="metric-label">Active Holds</span>
            </div>
          </div>
          <div className="metric-box">
            <span className="metric-icon">📖</span>
            <div className="metric-info">
              <span className="metric-number">{currentlyIssued}</span>
              <span className="metric-label">Books on Loan</span>
            </div>
          </div>
          <div className="metric-box">
            <span className="metric-icon">📚</span>
            <div className="metric-info">
              <span className="metric-number">{reservations.length}</span>
              <span className="metric-label">Total Reservations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: My Reservations */}
      <section className="dashboard-section" aria-labelledby="reservations-heading">
        <div className="section-header">
          <h2 id="reservations-heading" className="section-title">
            My Reservations
          </h2>
          <span className="section-count">
            {reservations.length} {reservations.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {reservations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Active Reservations</h3>
            <p>You have not placed any book reservations yet.</p>
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
                  <th>Reserved On</th>
                  <th>Status</th>
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
                            By {res.author_name || 'Unknown Author'} &bull; ISBN: {res.book_isbn}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: My Transactions */}
      <section className="dashboard-section" aria-labelledby="transactions-heading">
        <div className="section-header">
          <h2 id="transactions-heading" className="section-title">
            My Circulation History
          </h2>
          <span className="section-count">
            {transactions.length} {transactions.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <h3>No Circulation Transactions</h3>
            <p>You have no borrowing or return transaction history recorded in the system.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className="table-book-info">
                        <Link to={`/books/${tx.book_id}`} className="table-book-title">
                          {tx.book_title}
                        </Link>
                        <span className="table-book-sub">
                          By {tx.author_name || 'Unknown'} &bull; ISBN: {tx.book_isbn}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${tx.status.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{formatDate(tx.issue_date)}</td>
                    <td>
                      <span className={tx.status === 'OVERDUE' ? 'text-danger font-semibold' : ''}>
                        {formatDate(tx.due_date)}
                      </span>
                    </td>
                    <td>{formatDate(tx.return_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
