import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';
import bookService from '../services/bookService';
import authorService from '../services/authorService';
import AdminBookForm from '../components/AdminBookForm';
import AdminAuthorForm from '../components/AdminAuthorForm';
import AdminMemberModal from '../components/AdminMemberModal';
import AdminIssueModal from '../components/AdminIssueModal';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function AdminDashboard() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core administrative data
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);

  // Lifecycle states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Modal dialog states
  const [bookModal, setBookModal] = useState({ isOpen: false, data: null, isSubmitting: false });
  const [authorModal, setAuthorModal] = useState({ isOpen: false, data: null, isSubmitting: false });
  const [memberModal, setMemberModal] = useState({ isOpen: false, member: null });
  const [issueModal, setIssueModal] = useState({ isOpen: false, prefillReservation: null, isSubmitting: false });

  // Tab-specific search & filter states
  const [bookSearch, setBookSearch] = useState('');
  const [bookCategory, setBookCategory] = useState('all');
  const [bookAvailability, setBookAvailability] = useState('all');

  const [authorSearch, setAuthorSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  const [resFilter, setResFilter] = useState('all');
  const [resSearch, setResSearch] = useState('');

  const [loanFilter, setLoanFilter] = useState('all');
  const [loanSearch, setLoanSearch] = useState('');

  const [invSearch, setInvSearch] = useState('');
  const [invFilter, setInvFilter] = useState('all');

  // Load all administrative datasets concurrently
  const loadAdminData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setFeedback((prev) => ({ ...prev, error: '' }));

    try {
      const [booksData, authorsData, reservationsData, transactionsData, usersData] = await Promise.all([
        bookService.getBooks({ limit: 200 }),
        authorService.getAuthors(),
        adminService.getAllReservations(),
        adminService.getAllTransactions(),
        adminService.getAllUsers(),
      ]);

      setBooks(booksData.books || []);
      setAuthors(authorsData || []);
      setReservations(reservationsData || []);
      setTransactions(transactionsData || []);
      setMembers(usersData || []);
    } catch (err) {
      console.error('Failed to load admin datasets:', err);
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

  // Date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- Real Metric Computations ---
  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + (Number(b.total_copies) || 0), 0);
  const availableCopies = books.reduce((sum, b) => sum + (Number(b.available_copies) || 0), 0);
  const loanedCopies = Math.max(0, totalCopies - availableCopies);

  const activeLoans = transactions.filter(
    (t) => t.status === 'ISSUED' || t.status === 'OVERDUE'
  ).length;

  const overdueLoans = transactions.filter((t) => {
    if (t.status === 'OVERDUE') return true;
    if (t.status === 'ISSUED' && t.due_date) {
      return new Date(t.due_date) < new Date();
    }
    return false;
  }).length;

  const activeReservations = reservations.filter(
    (r) => r.status === 'PENDING' || r.status === 'APPROVED'
  ).length;

  const pendingReservations = reservations.filter((r) => r.status === 'PENDING').length;
  const registeredMembers = members.length;

  // Categories list
  const categories = useMemo(() => {
    return Array.from(new Set(books.map((b) => b.category).filter(Boolean))).sort();
  }, [books]);

  // --- Handlers: Book Management ---
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
        await adminService.updateBook(bookModal.data.id, bookFormData);
        setFeedback({
          error: '',
          success: `Book "${bookFormData.title}" updated successfully!`,
        });
      } else {
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
        error: err.message || 'Failed to save book. Please check inputs.',
        success: '',
      });
      setBookModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setActionLoadingId(`del-book-${bookId}`);
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

  // Quick Copy Adjustment (+1 / -1)
  const handleQuickCopyAdjust = async (book, delta) => {
    const newTotal = (book.total_copies || 0) + delta;
    if (newTotal < 1) {
      setFeedback({ error: 'A book must have at least 1 copy in inventory.', success: '' });
      return;
    }
    const borrowed = (book.total_copies || 0) - (book.available_copies || 0);
    if (newTotal < borrowed) {
      setFeedback({
        error: `Cannot reduce total copies below currently borrowed count (${borrowed}).`,
        success: '',
      });
      return;
    }

    setActionLoadingId(`adj-${book.id}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.updateBook(book.id, {
        title: book.title,
        isbn: book.isbn,
        author_id: book.author_id,
        category: book.category,
        total_copies: newTotal,
        description: book.description || '',
      });
      setFeedback({
        error: '',
        success: `Stock copies for "${book.title}" adjusted to ${newTotal}.`,
      });
      await loadAdminData(true);
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to adjust copies.', success: '' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Handlers: Author Management ---
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
      setFeedback({
        error: err.message || 'Failed to save author.',
        success: '',
      });
      setAuthorModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleDeleteAuthor = async (authorId, name) => {
    const confirmed = window.confirm(`Are you sure you want to delete author "${name}"?`);
    if (!confirmed) return;

    setActionLoadingId(`del-author-${authorId}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.deleteAuthor(authorId);
      setFeedback({
        error: '',
        success: `Author "${name}" deleted successfully.`,
      });
      await loadAdminData(true);
    } catch (err) {
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

  // --- Handlers: Reservation Management ---
  const handleApproveReservation = async (reservationId, bookTitle) => {
    setActionLoadingId(`res-app-${reservationId}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.approveReservation(reservationId);
      setFeedback({
        error: '',
        success: `Hold reservation for "${bookTitle}" approved for pickup!`,
      });
      await loadAdminData(true);
    } catch (err) {
      setFeedback({
        error: err.message || 'Unable to approve reservation.',
        success: '',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelReservation = async (reservationId, bookTitle) => {
    const confirmed = window.confirm(`Cancel reservation hold for "${bookTitle}"? The copy will be restored to shelf stock.`);
    if (!confirmed) return;

    setActionLoadingId(`res-canc-${reservationId}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.cancelReservation(reservationId);
      setFeedback({
        error: '',
        success: `Reservation hold for "${bookTitle}" cancelled. Inventory restored.`,
      });
      await loadAdminData(true);
    } catch (err) {
      setFeedback({
        error: err.message || 'Unable to cancel reservation.',
        success: '',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Issue Modal prefilled with approved hold
  const handleIssueFromReservation = (res) => {
    setIssueModal({
      isOpen: true,
      prefillReservation: res,
      isSubmitting: false,
    });
  };

  // --- Handlers: Loan Management ---
  const handleIssueSubmit = async (payload) => {
    setIssueModal((prev) => ({ ...prev, isSubmitting: true }));
    setFeedback({ error: '', success: '' });

    try {
      await adminService.issueBook(payload);
      setFeedback({
        error: '',
        success: 'Book volume issued successfully! Standard 14-day loan recorded.',
      });
      setIssueModal({ isOpen: false, prefillReservation: null, isSubmitting: false });
      await loadAdminData(true);
    } catch (err) {
      setFeedback({
        error: err.message || 'Failed to issue book.',
        success: '',
      });
      setIssueModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleReturnBook = async (transactionId, bookTitle) => {
    const confirmed = window.confirm(`Confirm return of "${bookTitle}"? Shelf inventory will be incremented.`);
    if (!confirmed) return;

    setActionLoadingId(`ret-${transactionId}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.returnBook(transactionId);
      setFeedback({
        error: '',
        success: `"${bookTitle}" marked as RETURNED. Shelf stock restored.`,
      });
      await loadAdminData(true);
    } catch (err) {
      setFeedback({
        error: err.message || 'Unable to process book return.',
        success: '',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRenewLoan = async (transactionId, bookTitle) => {
    setActionLoadingId(`ren-${transactionId}`);
    setFeedback({ error: '', success: '' });

    try {
      await adminService.renewLoan(transactionId);
      setFeedback({
        error: '',
        success: `Loan for "${bookTitle}" successfully renewed for +14 additional days!`,
      });
      await loadAdminData(true);
    } catch (err) {
      setFeedback({
        error: err.message || 'Unable to renew loan.',
        success: '',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Filtered Datasets ---
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !bookSearch ||
        b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
        b.isbn.toLowerCase().includes(bookSearch.toLowerCase()) ||
        (b.author_name && b.author_name.toLowerCase().includes(bookSearch.toLowerCase()));

      const matchCat = bookCategory === 'all' || b.category === bookCategory;
      const matchAvail =
        bookAvailability === 'all' ||
        (bookAvailability === 'in' && b.available_copies > 0) ||
        (bookAvailability === 'out' && b.available_copies === 0);

      return matchSearch && matchCat && matchAvail;
    });
  }, [books, bookSearch, bookCategory, bookAvailability]);

  const filteredAuthors = useMemo(() => {
    return authors.filter(
      (a) =>
        !authorSearch ||
        a.name.toLowerCase().includes(authorSearch.toLowerCase()) ||
        (a.biography && a.biography.toLowerCase().includes(authorSearch.toLowerCase()))
    );
  }, [authors, authorSearch]);

  const filteredMembers = useMemo(() => {
    return members.filter(
      (m) =>
        !memberSearch ||
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [members, memberSearch]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchSearch =
        !resSearch ||
        (r.book_title && r.book_title.toLowerCase().includes(resSearch.toLowerCase())) ||
        (r.user_name && r.user_name.toLowerCase().includes(resSearch.toLowerCase())) ||
        (r.user_email && r.user_email.toLowerCase().includes(resSearch.toLowerCase()));

      const matchStatus = resFilter === 'all' || r.status === resFilter;
      return matchSearch && matchStatus;
    });
  }, [reservations, resSearch, resFilter]);

  const filteredLoans = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !loanSearch ||
        (t.book_title && t.book_title.toLowerCase().includes(loanSearch.toLowerCase())) ||
        (t.user_name && t.user_name.toLowerCase().includes(loanSearch.toLowerCase())) ||
        (t.user_email && t.user_email.toLowerCase().includes(loanSearch.toLowerCase()));

      let matchStatus = true;
      if (loanFilter === 'active') {
        matchStatus = t.status === 'ISSUED';
      } else if (loanFilter === 'overdue') {
        matchStatus = t.status === 'OVERDUE' || (t.status === 'ISSUED' && new Date(t.due_date) < new Date());
      } else if (loanFilter === 'returned') {
        matchStatus = t.status === 'RETURNED';
      }

      return matchSearch && matchStatus;
    });
  }, [transactions, loanSearch, loanFilter]);

  const filteredInventory = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !invSearch ||
        b.title.toLowerCase().includes(invSearch.toLowerCase()) ||
        b.isbn.toLowerCase().includes(invSearch.toLowerCase());

      let matchFilter = true;
      if (invFilter === 'low') {
        matchFilter = b.available_copies > 0 && b.available_copies <= 2;
      } else if (invFilter === 'out') {
        matchFilter = b.available_copies === 0;
      } else if (invFilter === 'in') {
        matchFilter = b.available_copies > 2;
      }

      return matchSearch && matchFilter;
    });
  }, [books, invSearch, invFilter]);

  if (loading) {
    return <Loading message="Loading Administrator Control Panel..." />;
  }

  return (
    <div className="page-container admin-container">
      {/* 1. TOP HEADER SECTION */}
      <div className="page-header admin-header">
        <div>
          <div className="badge badge-admin" style={{ marginBottom: '0.4rem' }}>
            System Administrator Control
          </div>
          <h1 className="page-title">Departmental Library Operations</h1>
          <p className="page-subtitle">
            Manage catalog volumes, author repository, circulation desk loans, member profiles, and shelf inventory.
          </p>
        </div>
        <div className="admin-header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadAdminData(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIssueModal({ isOpen: true, prefillReservation: null, isSubmitting: false })}
          >
            📖 Issue Book
          </button>
        </div>
      </div>

      {/* 2. FEEDBACK BANNERS */}
      {feedback.error && (
        <ErrorMessage message={feedback.error} onRetry={() => loadAdminData(true)} />
      )}
      {feedback.success && (
        <div className="success-banner" role="status">
          <span>✅ {feedback.success}</span>
        </div>
      )}

      {/* 3. ADMIN STATS OVERVIEW CARDS (Real backend data) */}
      <div className="admin-overview-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        <div className="metric-box admin-stat-card" onClick={() => setActiveTab('books')} style={{ cursor: 'pointer' }}>
          <span className="metric-icon">📚</span>
          <span className="metric-number">{totalBooks}</span>
          <span className="metric-label">Total Books</span>
        </div>

        <div className="metric-box admin-stat-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
          <span className="metric-icon">📦</span>
          <span className="metric-number">{totalCopies}</span>
          <span className="metric-label">Total Copies</span>
        </div>

        <div className="metric-box admin-stat-card" onClick={() => setActiveTab('inventory')} style={{ cursor: 'pointer' }}>
          <span className="metric-icon">📗</span>
          <span className="metric-number text-success">{availableCopies}</span>
          <span className="metric-label">Available Copies</span>
        </div>

        <div className="metric-box admin-stat-card" onClick={() => setActiveTab('loans')} style={{ cursor: 'pointer' }}>
          <span className="metric-icon">📖</span>
          <span className="metric-number text-primary">{activeLoans}</span>
          <span className="metric-label">Active Loans</span>
        </div>

        <div className="metric-box admin-stat-card" onClick={() => setActiveTab('reservations')} style={{ cursor: 'pointer' }}>
          <span className="metric-icon">⏳</span>
          <span className="metric-number text-warning">{activeReservations}</span>
          <span className="metric-label">Active Holds</span>
        </div>

        <div className="metric-box admin-stat-card" onClick={() => setActiveTab('loans')} style={{ cursor: 'pointer' }}>
          <span className="metric-icon">⚠️</span>
          <span className="metric-number text-danger">{overdueLoans}</span>
          <span className="metric-label">Overdue Loans</span>
        </div>

        <div className="metric-box admin-stat-card" onClick={() => setActiveTab('members')} style={{ cursor: 'pointer' }}>
          <span className="metric-icon">👥</span>
          <span className="metric-number">{registeredMembers}</span>
          <span className="metric-label">Registered Members</span>
        </div>
      </div>

      {/* 4. NAVIGATION TABS (All 8 Core Sections) */}
      <div className="admin-tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'dashboard'}
          className={`admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'books'}
          className={`admin-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          📚 Books ({books.length})
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
          aria-selected={activeTab === 'inventory'}
          className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventory
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'members'}
          className={`admin-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 Members ({members.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reservations'}
          className={`admin-tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📑 Reservations ({pendingReservations > 0 ? `${reservations.length} (${pendingReservations} new)` : reservations.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'loans'}
          className={`admin-tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          📖 Loans ({overdueLoans > 0 ? `${transactions.length} (${overdueLoans} overdue)` : transactions.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reports'}
          className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Reports
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="admin-tab-content">
          <div className="academic-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Left Card: Urgent Action Queue */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                ⚡ Action Required ({pendingReservations + overdueLoans})
              </h3>
              {pendingReservations === 0 && overdueLoans === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '2rem' }}>🎉</span>
                  <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>All caught up!</p>
                  <p className="text-sm">No pending hold requests or overdue loans need review.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendingReservations > 0 && (
                    <div style={{ padding: '0.75rem', background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>⏳ {pendingReservations} Pending Reservation Hold(s)</strong>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Students awaiting desk approval for physical checkout.</p>
                      </div>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setActiveTab('reservations')}>Review &rarr;</button>
                    </div>
                  )}

                  {overdueLoans > 0 && (
                    <div style={{ padding: '0.75rem', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: 'var(--error)', fontSize: '0.85rem' }}>⚠️ {overdueLoans} Overdue Borrowing(s)</strong>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Volumes past due date requiring contact or return.</p>
                      </div>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setActiveTab('loans'); setLoanFilter('overdue'); }}>Inspect &rarr;</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Card: Quick Operations */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                🚀 Quick Desk Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setIssueModal({ isOpen: true, prefillReservation: null, isSubmitting: false })}
                >
                  📖 Issue Book
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'center' }}
                  onClick={handleOpenAddBook}
                >
                  ➕ Add New Title
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'center' }}
                  onClick={handleOpenAddAuthor}
                >
                  ✍️ Add Author
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setActiveTab('reports')}
                >
                  📈 View Reports
                </button>
              </div>

              {/* Departmental Metrics Mini Bar */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <span>Shelf Availability Rate</span>
                  <strong>{totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0}%</strong>
                </div>
                <div className="availability-meter-wrap" style={{ height: '6px' }}>
                  <div
                    className="availability-meter-bar"
                    style={{ width: `${totalCopies > 0 ? (availableCopies / totalCopies) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BOOKS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'books' && (
        <div className="admin-tab-content">
          <div className="admin-section-header">
            <div>
              <h2 className="section-title">Departmental Books Catalog</h2>
              <p className="text-secondary text-sm">
                Search, filter, edit, view details, and manage physical inventory copies.
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleOpenAddBook}>
              ➕ Add New Book
            </button>
          </div>

          {/* Search & Filters Toolbar */}
          <div className="admin-search-toolbar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, minWidth: '220px' }}
              placeholder="Search by title, ISBN, or author..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
            />
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={bookCategory}
              onChange={(e) => setBookCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={bookAvailability}
              onChange={(e) => setBookAvailability(e.target.value)}
            >
              <option value="all">All Stock Statuses</option>
              <option value="in">Available on Shelf</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* Books Table */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title &amp; Category</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Shelf Stock</th>
                  <th>Manage Copies</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-secondary py-4">
                      No books matching search filters.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((b) => {
                    const isAvailable = b.available_copies > 0;
                    return (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.title}</strong>
                          <div style={{ marginTop: '0.2rem' }}>
                            <span className="category-pill" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                              {b.category}
                            </span>
                          </div>
                        </td>
                        <td>{b.author_name || '—'}</td>
                        <td className="font-mono text-sm">{b.isbn}</td>
                        <td>
                          <span className={`stock-badge ${isAvailable ? 'badge-in-stock' : 'badge-out-of-stock'}`}>
                            {b.available_copies} / {b.total_copies}
                          </span>
                        </td>
                        {/* Manage Copies: Quick Increment / Decrement */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              title="Decrease total copies by 1"
                              onClick={() => handleQuickCopyAdjust(b, -1)}
                              disabled={actionLoadingId === `adj-${b.id}`}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 600, minWidth: '1.5rem', textAlign: 'center' }}>
                              {b.total_copies}
                            </span>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              title="Increase total copies by 1"
                              onClick={() => handleQuickCopyAdjust(b, 1)}
                              disabled={actionLoadingId === `adj-${b.id}`}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <Link to={`/books/${b.id}`} className="btn btn-outline btn-xs" title="View details">
                              View
                            </Link>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => handleOpenEditBook(b)}
                              title="Edit book details"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs text-danger"
                              onClick={() => handleDeleteBook(b.id, b.title)}
                              disabled={actionLoadingId === `del-book-${b.id}`}
                              title="Delete book"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUTHORS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'authors' && (
        <div className="admin-tab-content">
          <div className="admin-section-header">
            <div>
              <h2 className="section-title">Author Directory</h2>
              <p className="text-secondary text-sm">
                Manage registered departmental authors and their bibliographic profiles.
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleOpenAddAuthor}>
              ➕ Add New Author
            </button>
          </div>

          <div style={{ marginBottom: '1rem', maxWidth: '380px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search authors by name..."
              value={authorSearch}
              onChange={(e) => setAuthorSearch(e.target.value)}
            />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Author Name</th>
                  <th>Biography</th>
                  <th>Associated Books</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-secondary py-4">
                      No authors registered.
                    </td>
                  </tr>
                ) : (
                  filteredAuthors.map((a) => {
                    const authorBooks = books.filter((b) => b.author_id === a.id);
                    return (
                      <tr key={a.id}>
                        <td><strong>{a.name}</strong></td>
                        <td className="text-secondary text-sm" style={{ maxWidth: '300px' }}>
                          {a.biography ? a.biography.slice(0, 100) + '...' : 'No biography.'}
                        </td>
                        <td>
                          <span className="badge badge-in-stock">{authorBooks.length} Books</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => handleOpenEditAuthor(a)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs text-danger"
                              onClick={() => handleDeleteAuthor(a.id, a.name)}
                              disabled={actionLoadingId === `del-author-${a.id}`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INVENTORY MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="admin-tab-content">
          <div className="admin-section-header">
            <div>
              <h2 className="section-title">Live Shelf Inventory</h2>
              <p className="text-secondary text-sm">
                Real-time tracking of shelf stock, borrowed copies, and low inventory warnings.
              </p>
            </div>
          </div>

          {/* Search & Stock Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, minWidth: '220px' }}
              placeholder="Search inventory by title or ISBN..."
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
            />
            <select
              className="form-input"
              style={{ width: 'auto' }}
              value={invFilter}
              onChange={(e) => setInvFilter(e.target.value)}
            >
              <option value="all">All Shelf Levels</option>
              <option value="in">Normal Stock (&gt;2 copies)</option>
              <option value="low">Limited Stock (&le;2 copies)</option>
              <option value="out">Depleted / Out of Stock</option>
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Volume Title</th>
                  <th>Total Copies</th>
                  <th>Available on Shelf</th>
                  <th>Currently Loaned</th>
                  <th>Status Warning</th>
                  <th style={{ textAlign: 'right' }}>Quick Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-secondary py-4">
                      No inventory matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((b) => {
                    const borrowed = Math.max(0, (b.total_copies || 0) - (b.available_copies || 0));
                    const isOut = b.available_copies === 0;
                    const isLow = b.available_copies > 0 && b.available_copies <= 2;

                    return (
                      <tr key={b.id}>
                        <td><strong>{b.title}</strong></td>
                        <td>{b.total_copies}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: isOut ? 'var(--error)' : 'var(--success)' }}>
                            {b.available_copies}
                          </span>
                        </td>
                        <td>{borrowed}</td>
                        <td>
                          {isOut ? (
                            <span className="badge badge-cancelled">Depleted</span>
                          ) : isLow ? (
                            <span className="badge badge-pending">Low Stock ({b.available_copies} left)</span>
                          ) : (
                            <span className="badge badge-in-stock">Adequate Stock</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => handleQuickCopyAdjust(b, -1)}
                              disabled={actionLoadingId === `adj-${b.id}`}
                              title="Deduct 1 total copy"
                            >
                              -1 Copy
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => handleQuickCopyAdjust(b, 1)}
                              disabled={actionLoadingId === `adj-${b.id}`}
                              title="Add 1 copy to inventory"
                            >
                              +1 Copy
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MEMBERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="admin-tab-content">
          <div className="admin-section-header">
            <div>
              <h2 className="section-title">Registered Library Members</h2>
              <p className="text-secondary text-sm">
                View student and faculty accounts, active borrowings, and individual reservation history.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', maxWidth: '380px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search member by name or email..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Active Loans</th>
                  <th>Holds</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-secondary py-4">
                      No members found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => {
                    const memberLoans = transactions.filter(
                      (t) => t.user_id === m.id && (t.status === 'ISSUED' || t.status === 'OVERDUE')
                    ).length;
                    const memberHolds = reservations.filter(
                      (r) => r.user_id === m.id && (r.status === 'PENDING' || r.status === 'APPROVED')
                    ).length;

                    return (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong></td>
                        <td>{m.email}</td>
                        <td>
                          <span className={`badge ${m.role === 'ADMIN' ? 'badge-admin' : 'badge-in-stock'}`}>
                            {m.role}
                          </span>
                        </td>
                        <td>{formatDate(m.created_at)}</td>
                        <td>
                          {memberLoans > 0 ? (
                            <span className="badge badge-pending">{memberLoans} Loan(s)</span>
                          ) : (
                            <span className="text-secondary text-xs">0</span>
                          )}
                        </td>
                        <td>
                          {memberHolds > 0 ? (
                            <span className="badge badge-in-stock">{memberHolds} Hold(s)</span>
                          ) : (
                            <span className="text-secondary text-xs">0</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => setMemberModal({ isOpen: true, member: m })}
                          >
                            View Activity &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RESERVATIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'reservations' && (
        <div className="admin-tab-content">
          <div className="admin-section-header">
            <div>
              <h2 className="section-title">Book Reservations &amp; Holds</h2>
              <p className="text-secondary text-sm">
                Approve pending reservations, cancel holds, or issue volumes directly to patrons.
              </p>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, minWidth: '220px' }}
              placeholder="Search holds by book title, member name, or email..."
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['all', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-xs ${resFilter === st ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setResFilter(st)}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hold ID</th>
                  <th>Book Title</th>
                  <th>Member</th>
                  <th>Reserved Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-secondary py-4">
                      No reservations matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((r) => {
                    const isPending = r.status === 'PENDING';
                    const isApproved = r.status === 'APPROVED';

                    return (
                      <tr key={r.id}>
                        <td className="font-mono text-sm">#{r.id}</td>
                        <td><strong>{r.book_title || '—'}</strong></td>
                        <td>
                          <div>{r.user_name || 'Member'}</div>
                          <span className="text-secondary text-xs">{r.user_email}</span>
                        </td>
                        <td>{formatDate(r.reservation_date)}</td>
                        <td>
                          <span
                            className={`badge ${
                              r.status === 'APPROVED'
                                ? 'badge-in-stock'
                                : r.status === 'PENDING'
                                ? 'badge-pending'
                                : r.status === 'CANCELLED'
                                ? 'badge-cancelled'
                                : 'badge-completed'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            {isPending && (
                              <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={() => handleApproveReservation(r.id, r.book_title)}
                                disabled={actionLoadingId === `res-app-${r.id}`}
                              >
                                Approve
                              </button>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={() => handleIssueFromReservation(r)}
                                title="Issue book volume for this approved hold"
                              >
                                Issue Book
                              </button>
                            )}

                            {(isPending || isApproved) && (
                              <button
                                type="button"
                                className="btn btn-outline btn-xs text-danger"
                                onClick={() => handleCancelReservation(r.id, r.book_title)}
                                disabled={actionLoadingId === `res-canc-${r.id}`}
                              >
                                Cancel Hold
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: LOANS & CIRCULATION MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'loans' && (
        <div className="admin-tab-content">
          <div className="admin-section-header">
            <div>
              <h2 className="section-title">Circulation &amp; Loan Tracking</h2>
              <p className="text-secondary text-sm">
                Issue books, process returns, renew loan periods, and monitor overdue volumes.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIssueModal({ isOpen: true, prefillReservation: null, isSubmitting: false })}
            >
              📖 Issue New Book
            </button>
          </div>

          {/* Search & Loan Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, minWidth: '220px' }}
              placeholder="Search loans by book, borrower, or email..."
              value={loanSearch}
              onChange={(e) => setLoanSearch(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active Loans' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'returned', label: 'Returned' },
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  className={`btn btn-xs ${loanFilter === flt.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setLoanFilter(flt.id)}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Book Title</th>
                  <th>Borrower</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-secondary py-4">
                      No circulation records match filter.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((t) => {
                    const isIssued = t.status === 'ISSUED';
                    const isOverdue = t.status === 'OVERDUE' || (isIssued && new Date(t.due_date) < new Date());
                    const isReturned = t.status === 'RETURNED';

                    return (
                      <tr key={t.id}>
                        <td className="font-mono text-sm">#{t.id}</td>
                        <td><strong>{t.book_title || '—'}</strong></td>
                        <td>
                          <div>{t.user_name || 'Member'}</div>
                          <span className="text-secondary text-xs">{t.user_email}</span>
                        </td>
                        <td>{formatDate(t.issue_date)}</td>
                        <td>
                          <span style={{ fontWeight: isOverdue ? 700 : 400, color: isOverdue ? 'var(--error)' : 'inherit' }}>
                            {formatDate(t.due_date)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              isOverdue
                                ? 'badge-cancelled'
                                : isIssued
                                ? 'badge-in-stock'
                                : 'badge-completed'
                            }`}
                          >
                            {isOverdue ? 'OVERDUE' : t.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            {!isReturned && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-xs"
                                  onClick={() => handleRenewLoan(t.id, t.book_title)}
                                  disabled={actionLoadingId === `ren-${t.id}`}
                                  title="Extend loan due date by 14 days"
                                >
                                  🔄 Renew (+14d)
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  onClick={() => handleReturnBook(t.id, t.book_title)}
                                  disabled={actionLoadingId === `ret-${t.id}`}
                                  title="Mark volume returned and restore shelf inventory"
                                >
                                  📥 Return
                                </button>
                              </>
                            )}
                            {isReturned && (
                              <span className="text-secondary text-xs">Returned on {formatDate(t.return_date)}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: REPORTS & ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="admin-tab-content">
          <div className="admin-section-header">
            <div>
              <h2 className="section-title">Departmental Library Reports</h2>
              <p className="text-secondary text-sm">
                Aggregated inventory metrics, collection health, and circulation turnover statistics.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => window.print()}
            >
              🖨️ Print / Save Report
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Report 1: Inventory Health */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                📦 Inventory Status Breakdown
              </h3>
              <table className="admin-table text-sm">
                <tbody>
                  <tr>
                    <td>Total Distinct Titles</td>
                    <td className="text-right font-mono font-bold">{totalBooks}</td>
                  </tr>
                  <tr>
                    <td>Total Volume Units</td>
                    <td className="text-right font-mono font-bold">{totalCopies}</td>
                  </tr>
                  <tr>
                    <td>Currently on Shelf</td>
                    <td className="text-right font-mono font-bold text-success">{availableCopies}</td>
                  </tr>
                  <tr>
                    <td>Currently Loaned Out</td>
                    <td className="text-right font-mono font-bold text-primary">{loanedCopies}</td>
                  </tr>
                  <tr>
                    <td>Shelf Availability Rate</td>
                    <td className="text-right font-mono font-bold">
                      {totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Report 2: Circulation Summary */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                📖 Circulation Activity
              </h3>
              <table className="admin-table text-sm">
                <tbody>
                  <tr>
                    <td>Total Loans (All-Time)</td>
                    <td className="text-right font-mono font-bold">{transactions.length}</td>
                  </tr>
                  <tr>
                    <td>Active Loans in Circulation</td>
                    <td className="text-right font-mono font-bold text-primary">{activeLoans}</td>
                  </tr>
                  <tr>
                    <td>Returned Loans</td>
                    <td className="text-right font-mono font-bold text-success">
                      {transactions.filter((t) => t.status === 'RETURNED').length}
                    </td>
                  </tr>
                  <tr>
                    <td>Overdue Volumes</td>
                    <td className="text-right font-mono font-bold text-danger">{overdueLoans}</td>
                  </tr>
                  <tr>
                    <td>Active Reservation Holds</td>
                    <td className="text-right font-mono font-bold text-warning">{activeReservations}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Report 3: Category Distribution */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                📚 Collection by Category
              </h3>
              <table className="admin-table text-sm">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-right">Titles</th>
                    <th className="text-right">Copies</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const catBooks = books.filter((b) => b.category === cat);
                    const catCopies = catBooks.reduce((sum, b) => sum + (Number(b.total_copies) || 0), 0);
                    return (
                      <tr key={cat}>
                        <td><strong>{cat}</strong></td>
                        <td className="text-right font-mono">{catBooks.length}</td>
                        <td className="text-right font-mono">{catCopies}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DIALOGS */}
      {/* ========================================================================= */}
      {/* 1. Add / Edit Book Form Modal */}
      <AdminBookForm
        isOpen={bookModal.isOpen}
        initialData={bookModal.data}
        authors={authors}
        isSubmitting={bookModal.isSubmitting}
        onSubmit={handleSaveBook}
        onClose={() => setBookModal({ isOpen: false, data: null, isSubmitting: false })}
      />

      {/* 2. Add / Edit Author Form Modal */}
      <AdminAuthorForm
        isOpen={authorModal.isOpen}
        initialData={authorModal.data}
        isSubmitting={authorModal.isSubmitting}
        onSubmit={handleSaveAuthor}
        onClose={() => setAuthorModal({ isOpen: false, data: null, isSubmitting: false })}
      />

      {/* 3. Member Profile & Activity Modal */}
      <AdminMemberModal
        isOpen={memberModal.isOpen}
        member={memberModal.member}
        reservations={reservations}
        transactions={transactions}
        onClose={() => setMemberModal({ isOpen: false, member: null })}
      />

      {/* 4. Issue Book Modal */}
      <AdminIssueModal
        isOpen={issueModal.isOpen}
        books={books}
        members={members}
        prefillReservation={issueModal.prefillReservation}
        isSubmitting={issueModal.isSubmitting}
        onSubmit={handleIssueSubmit}
        onClose={() => setIssueModal({ isOpen: false, prefillReservation: null, isSubmitting: false })}
      />
    </div>
  );
}

export default AdminDashboard;
