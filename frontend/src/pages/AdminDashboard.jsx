import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';
import bookService from '../services/bookService';
import authorService from '../services/authorService';
import AdminBookForm from '../components/AdminBookForm';
import AdminAuthorForm from '../components/AdminAuthorForm';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function AdminDashboard() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'authors' | 'reservations' | 'transactions'

  // Data states
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Lifecycle states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Modal form states
  const [bookModal, setBookModal] = useState({ isOpen: false, data: null, isSubmitting: false });
  const [authorModal, setAuthorModal] = useState({ isOpen: false, data: null, isSubmitting: false });

  // Load all administrative data
  const loadAdminData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setFeedback((prev) => ({ ...prev, error: '' }));

    try {
      const [booksData, authorsData, reservationsData, transactionsData] = await Promise.all([
        bookService.getBooks({ limit: 100 }),
        authorService.getAuthors(),
        adminService.getAllReservations(),
        adminService.getAllTransactions(),
      ]);

      setBooks(booksData.books || []);
      setAuthors(authorsData || []);
      setReservations(reservationsData || []);
      setTransactions(transactionsData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setFeedback((prev) => ({
        ...prev,
        error: err.message || 'Unable to retrieve administration records. Please try again.',
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  };

  // --- Book Management Handlers ---
  const handleOpenAddBook = () => {
    setBookModal({ isOpen: true, data: null, isSubmitting: false });
  };

  const handleOpenEditBook = (book) => {
    setBookModal({ isOpen: true, data: book, isSubmitting: false });
  };

  const handleSaveBook = async (bookFormData) => {
    setBookModal((prev) => ({ ...prev, isSubmitting: true }));
    setFeedback({ error: '', success: '' });

    try {
      if (bookModal.data?.id) {
        // Edit existing book
        await adminService.updateBook(bookModal.data.id, bookFormData);
        setFeedback({
          error: '',
          success: `Book "${bookFormData.title}" updated successfully!`,
        });
      } else {
        // Create new book
        await adminService.createBook(bookFormData);
        setFeedback({
          error: '',
          success: `Book "${bookFormData.title}" added to catalog successfully!`,
        });
      }
      setBookModal({ isOpen: false, data: null, isSubmitting: false });
      await loadAdminData(true);
    } catch (err) {
      console.error('Book save failed:', err);
      setFeedback({
        error: err.message || 'Failed to save book. Please check the inputs.',
        success: '',
      });
      setBookModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setActionLoadingId(`book-${bookId}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.deleteBook(bookId);
      setFeedback({
        error: '',
        success: `Book "${title}" deleted successfully.`,
      });
      await loadAdminData(true);
    } catch (err) {
      console.error('Delete book failed:', err);
      if (err.status === 409) {
        setFeedback({
          error: `Cannot delete book "${title}" because active reservations or loans reference this book.`,
          success: '',
        });
      } else {
        setFeedback({
          error: err.message || 'Failed to delete book.',
          success: '',
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Author Management Handlers ---
  const handleOpenAddAuthor = () => {
    setAuthorModal({ isOpen: true, data: null, isSubmitting: false });
  };

  const handleOpenEditAuthor = (author) => {
    setAuthorModal({ isOpen: true, data: author, isSubmitting: false });
  };

  const handleSaveAuthor = async (authorFormData) => {
    setAuthorModal((prev) => ({ ...prev, isSubmitting: true }));
    setFeedback({ error: '', success: '' });

    try {
      if (authorModal.data?.id) {
        await adminService.updateAuthor(authorModal.data.id, authorFormData);
        setFeedback({
          error: '',
          success: `Author "${authorFormData.name}" updated successfully!`,
        });
      } else {
        await adminService.createAuthor(authorFormData);
        setFeedback({
          error: '',
          success: `Author "${authorFormData.name}" added successfully!`,
        });
      }
      setAuthorModal({ isOpen: false, data: null, isSubmitting: false });
      await loadAdminData(true);
    } catch (err) {
      console.error('Author save failed:', err);
      setFeedback({
        error: err.message || 'Failed to save author.',
        success: '',
      });
      setAuthorModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleDeleteAuthor = async (authorId, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete author "${name}"?`
    );
    if (!confirmed) return;

    setActionLoadingId(`author-${authorId}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.deleteAuthor(authorId);
      setFeedback({
        error: '',
        success: `Author "${name}" deleted successfully.`,
      });
      await loadAdminData(true);
    } catch (err) {
      console.error('Delete author failed:', err);
      if (err.status === 409) {
        setFeedback({
          error: `Cannot delete author "${name}" because books are associated with this author.`,
          success: '',
        });
      } else {
        setFeedback({
          error: err.message || 'Failed to delete author.',
          success: '',
        });
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Reservation Approval Handler ---
  const handleApproveReservation = async (reservationId, bookTitle) => {
    setActionLoadingId(`res-${reservationId}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.approveReservation(reservationId);
      setFeedback({
        error: '',
        success: `Reservation hold for "${bookTitle}" approved successfully!`,
      });
      await loadAdminData(true);
    } catch (err) {
      console.error('Approve reservation failed:', err);
      setFeedback({
        error: err.message || 'Unable to approve reservation.',
        success: '',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics calculations
  const pendingReservations = reservations.filter((r) => r.status === 'PENDING').length;
  const activeLoans = transactions.filter(
    (t) => t.status === 'ISSUED' || t.status === 'OVERDUE'
  ).length;

  if (loading) {
    return <Loading message="Loading Administrator Control Panel..." />;
  }

  return (
    <div className="page-container admin-container">
      {/* Top Header */}
      <div className="page-header admin-header">
        <div>
          <div className="badge badge-admin" style={{ marginBottom: '0.5rem' }}>
            System Administrator Control
          </div>
          <h1 className="page-title">Administrator Dashboard</h1>
          <p className="page-subtitle">
            Manage library inventory, author directory, book reservations, and circulation tracking.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadAdminData(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh All'}
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback.error && (
        <ErrorMessage message={feedback.error} onRetry={() => loadAdminData(true)} />
      )}
      {feedback.success && (
        <div className="success-banner" role="status">
          <span>✅ {feedback.success}</span>
        </div>
      )}

      {/* Admin Overview Summary Cards */}
      <div className="admin-overview-grid">
        <div className="metric-box admin-stat-card">
          <span className="metric-icon">📚</span>
          <span className="metric-number">{books.length}</span>
          <span className="metric-label">Total Books</span>
        </div>
        <div className="metric-box admin-stat-card">
          <span className="metric-icon">✍️</span>
          <span className="metric-number">{authors.length}</span>
          <span className="metric-label">Registered Authors</span>
        </div>
        <div className="metric-box admin-stat-card">
          <span className="metric-icon">⏳</span>
          <span className="metric-number">{pendingReservations}</span>
          <span className="metric-label">Pending Holds</span>
        </div>
        <div className="metric-box admin-stat-card">
          <span className="metric-icon">📖</span>
          <span className="metric-number">{activeLoans}</span>
          <span className="metric-label">Active Loans</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'books'}
          className={`admin-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          📚 Book Inventory ({books.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'authors'}
          className={`admin-tab-btn ${activeTab === 'authors' ? 'active' : ''}`}
          onClick={() => setActiveTab('authors')}
        >
          ✍️ Authors ({authors.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reservations'}
          className={`admin-tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📑 Reservations ({reservations.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'transactions'}
          className={`admin-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📂 Circulation ({transactions.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BOOK INVENTORY MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'books' && (
        <section className="dashboard-section" aria-labelledby="admin-books-heading">
          <div className="section-header">
            <div>
              <h2 id="admin-books-heading" className="section-title">
                Book Inventory Management
              </h2>
              <p className="text-muted text-sm">
                Add, update, inspect real-time stock counts, and delete titles.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenAddBook}
            >
              + Add New Book
            </button>
          </div>

          {books.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>No Books in Database</h3>
              <p>Start by adding your first volume to the collection.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAddBook}
                style={{ marginTop: '0.75rem' }}
              >
                + Add Book
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title &amp; Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="table-book-info">
                          <Link to={`/books/${b.id}`} className="table-book-title">
                            {b.title}
                          </Link>
                          <span className="table-book-sub">
                            By {b.author_name || 'Unknown Author'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-sm">{b.isbn}</span>
                      </td>
                      <td>
                        <span className="category-pill">{b.category || 'General'}</span>
                      </td>
                      <td>
                        <strong>{b.total_copies}</strong>
                      </td>
                      <td>
                        <span
                          className={`stock-badge ${
                            b.available_copies > 0 ? 'badge-in-stock' : 'badge-out-of-stock'
                          }`}
                        >
                          {b.available_copies}
                        </span>
                      </td>
                      <td>
                        <div className="table-action-group">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEditBook(b)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-outline btn-sm"
                            onClick={() => handleDeleteBook(b.id, b.title)}
                            disabled={actionLoadingId === `book-${b.id}`}
                          >
                            {actionLoadingId === `book-${b.id}` ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 2: AUTHOR DIRECTORY MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'authors' && (
        <section className="dashboard-section" aria-labelledby="admin-authors-heading">
          <div className="section-header">
            <div>
              <h2 id="admin-authors-heading" className="section-title">
                Author Management
              </h2>
              <p className="text-muted text-sm">
                Manage registered authors, update biographical descriptions, and maintain directory records.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenAddAuthor}
            >
              + Add New Author
            </button>
          </div>

          {authors.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✍️</span>
              <h3>No Authors Found</h3>
              <p>Register the authors who write for your library.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAddAuthor}
                style={{ marginTop: '0.75rem' }}
              >
                + Add Author
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Author Name</th>
                    <th>Biography</th>
                    <th>Registered On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authors.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.name}</strong>
                      </td>
                      <td style={{ maxWidth: '380px' }}>
                        <p className="table-bio-text">
                          {a.biography || 'No biography recorded.'}
                        </p>
                      </td>
                      <td>{formatDate(a.created_at)}</td>
                      <td>
                        <div className="table-action-group">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEditAuthor(a)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-outline btn-sm"
                            onClick={() => handleDeleteAuthor(a.id, a.name)}
                            disabled={actionLoadingId === `author-${a.id}`}
                          >
                            {actionLoadingId === `author-${a.id}` ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 3: RESERVATION MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'reservations' && (
        <section className="dashboard-section" aria-labelledby="admin-res-heading">
          <div className="section-header">
            <div>
              <h2 id="admin-res-heading" className="section-title">
                System-wide Reservations
              </h2>
              <p className="text-muted text-sm">
                Review pending hold requests placed across the departmental library and approve holds.
              </p>
            </div>
          </div>

          {reservations.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>No Reservations Recorded</h3>
              <p>No students or members have placed holds yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Reserved On</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => {
                    const isPending = r.status === 'PENDING';
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="table-book-info">
                            <span className="table-book-title">{r.book_title}</span>
                            <span className="table-book-sub">ISBN: {r.book_isbn}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-user-info">
                            <strong>{r.user_name || `User #${r.user_id}`}</strong>
                            <span className="table-book-sub">{r.user_email || ''}</span>
                          </div>
                        </td>
                        <td>{formatDate(r.reservation_date)}</td>
                        <td>
                          <span className={`status-badge status-${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {isPending ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveReservation(r.id, r.book_title)}
                              disabled={actionLoadingId === `res-${r.id}`}
                            >
                              {actionLoadingId === `res-${r.id}` ? 'Approving...' : 'Approve Hold'}
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
      )}

      {/* ============================================================== */}
      {/* TAB 4: CIRCULATION TRANSACTION TRACKING */}
      {/* ============================================================== */}
      {activeTab === 'transactions' && (
        <section className="dashboard-section" aria-labelledby="admin-tx-heading">
          <div className="section-header">
            <div>
              <h2 id="admin-tx-heading" className="section-title">
                Circulation Loan Transactions
              </h2>
              <p className="text-muted text-sm">
                System-wide audit trail of issued books, due dates, returns, and overdue tracking.
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📂</span>
              <h3>No Transactions Recorded</h3>
              <p>No borrowing transactions exist in the system.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrower</th>
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
                          <span className="table-book-title">{tx.book_title}</span>
                          <span className="table-book-sub">ISBN: {tx.book_isbn}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-user-info">
                          <strong>{tx.user_name || `User #${tx.user_id}`}</strong>
                          <span className="table-book-sub">{tx.user_email || ''}</span>
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
      )}

      {/* Controlled Modals */}
      <AdminBookForm
        isOpen={bookModal.isOpen}
        initialData={bookModal.data}
        authors={authors}
        isSubmitting={bookModal.isSubmitting}
        onClose={() => setBookModal({ isOpen: false, data: null, isSubmitting: false })}
        onSubmit={handleSaveBook}
      />

      <AdminAuthorForm
        isOpen={authorModal.isOpen}
        initialData={authorModal.data}
        isSubmitting={authorModal.isSubmitting}
        onClose={() => setAuthorModal({ isOpen: false, data: null, isSubmitting: false })}
        onSubmit={handleSaveAuthor}
      />
    </div>
  );
}

export default AdminDashboard;
