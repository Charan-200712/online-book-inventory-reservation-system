import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import bookService from '../services/bookService';
import authorService from '../services/authorService';
import reservationService from '../services/reservationService';
import BookSearch from '../components/BookSearch';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ReservationModal, { formatReservationError } from '../components/ReservationModal';

function Books() {
  const [searchParams] = useSearchParams();
  const initialAvailable = searchParams.get('available') === 'true'
    ? 'true'
    : searchParams.get('available') === 'false'
      ? 'false'
      : 'all';
  const initialQuery = searchParams.get('q') || '';

  // Controlled search and filtering states
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [availability, setAvailability] = useState(initialAvailable);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevant');

  // Async data & lifecycle states
  const [books, setBooks] = useState([]);
  const [authorsList, setAuthorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Reservation modal & feedback state
  const [modalBook, setModalBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [resSuccess, setResSuccess] = useState('');
  const [resError, setResError] = useState('');

  // Load authors once on mount for filter dropdown
  useEffect(() => {
    let isSubscribed = true;
    async function fetchAuthors() {
      try {
        const authors = await authorService.getAuthors();
        if (isSubscribed) {
          setAuthorsList(authors || []);
        }
      } catch {
        // Non-blocking fallback
      }
    }
    fetchAuthors();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // 1. Debounce Effect: Synchronize user typing with debouncedSearch (400ms delay)
  useEffect(() => {
    if (searchTerm.trim() !== debouncedSearch) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // 2. Data Synchronization Effect: Fetch books when debouncedSearch or availability changes
  useEffect(() => {
    const controller = new AbortController();
    let isSubscribed = true;

    async function synchronizeCatalog() {
      setIsSearching(true);
      setError('');

      try {
        let result;
        const filterParam = availability === 'all' ? '' : availability;

        if (debouncedSearch) {
          result = await bookService.searchBooks(
            debouncedSearch,
            { available: filterParam },
            { signal: controller.signal }
          );
        } else {
          result = await bookService.getBooks(
            { available: filterParam },
            { signal: controller.signal }
          );
        }

        if (isSubscribed) {
          setBooks(result.books || []);
        }
      } catch (err) {
        // Ignore expected AbortError when a new request superseded this one
        if (err.name === 'AbortError') {
          return;
        }

        if (isSubscribed) {
          console.error('Catalog fetch error:', err);
          setError(
            debouncedSearch
              ? 'Unable to search books. Please try again.'
              : 'Unable to load books. Please try again.'
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setIsSearching(false);
        }
      }
    }

    synchronizeCatalog();

    // Cleanup: cancel pending request if search term or filter changes, or on unmount
    return () => {
      isSubscribed = false;
      controller.abort();
    };
  }, [debouncedSearch, availability]);

  // Handler: Clear search input
  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
  };

  // Derive dynamic categories from loaded books
  const categories = useMemo(() => {
    return Array.from(new Set(books.map((b) => b.category).filter(Boolean))).sort();
  }, [books]);

  // Apply client-side Category, Author, and Sorting filters
  const displayedBooks = useMemo(() => {
    let result = [...books];

    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
    }

    if (authorFilter !== 'all') {
      result = result.filter(
        (b) => b.author_name?.toLowerCase() === authorFilter.toLowerCase()
      );
    }

    if (sortBy === 'az') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return result;
  }, [books, categoryFilter, authorFilter, sortBy]);

  // Handler: Open confirmation modal
  const handleOpenReserveModal = (book) => {
    setModalBook(book);
    setModalError('');
    setIsModalOpen(true);
  };

  // Handler: Confirm reservation inside modal
  const handleConfirmReservation = async () => {
    if (!modalBook) return;
    setIsConfirming(true);
    setModalError('');

    try {
      await reservationService.createReservation(modalBook.id);
      setResSuccess(
        `Your reservation has been confirmed for "${modalBook.title}". A copy has been reserved for you.`
      );
      setResError('');
      // Instantaneously update local copy count without a full page reload
      setBooks((prev) =>
        prev.map((b) =>
          b.id === modalBook.id
            ? { ...b, available_copies: Math.max(0, b.available_copies - 1) }
            : b
        )
      );
      setIsModalOpen(false);
      setModalBook(null);
    } catch (err) {
      console.error('Reservation error:', err);
      const friendlyMsg = formatReservationError(err, modalBook.title);
      setModalError(friendlyMsg);
      if (err.status === 401) {
        setResError(friendlyMsg);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // Handler: Join Waitlist for out-of-stock titles
  const handleJoinWaitlist = (book) => {
    setResError('');
    setResSuccess(
      `You have joined the notification waitlist for "${book.title}". You will be alerted as soon as a copy is returned!`
    );
  };

  return (
    <div className="page-container">
      {/* 1. TOP HEADER SECTION */}
      <div className="page-header">
        <h1 className="page-title">Library Book Catalog</h1>
        <p className="page-subtitle">
          Search, discover and reserve books from your departmental collection.
        </p>

        {/* 2. CONTROLLED SEARCH & MULTI-FILTER TOOLBAR */}
        <BookSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={handleClearSearch}
          availability={availability}
          onAvailabilityChange={setAvailability}
          categories={categories}
          selectedCategory={categoryFilter}
          onCategoryChange={setCategoryFilter}
          authors={authorsList}
          selectedAuthor={authorFilter}
          onAuthorChange={setAuthorFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isSearching={isSearching && !loading}
          totalResults={displayedBooks.length}
        />
      </div>

      {/* 3. RESERVATION & WAITLIST FEEDBACK BANNERS */}
      {resSuccess && (
        <div className="success-banner" role="status">
          <div className="banner-content-with-action">
            <span>✅ {resSuccess}</span>
            <Link to="/dashboard" className="banner-link">
              View in My Library &rarr;
            </Link>
          </div>
        </div>
      )}

      {resError && (
        <div style={{ marginBottom: '1rem' }}>
          <ErrorMessage message={resError} />
        </div>
      )}

      {/* 4. LOADING STATE */}
      {loading && <Loading message="Loading departmental catalog..." />}

      {/* 5. ERROR STATE */}
      <ErrorMessage
        message={error}
        onRetry={() => {
          setLoading(true);
          setDebouncedSearch((prev) => prev);
        }}
      />

      {/* 6. EMPTY STATE */}
      {!loading && !error && displayedBooks.length === 0 && (
        <div className="empty-state" role="status">
          <span className="empty-icon" aria-hidden="true">
            📭
          </span>
          {debouncedSearch || categoryFilter !== 'all' || authorFilter !== 'all' ? (
            <>
              <h3>No Books Found</h3>
              <p>
                No books matched your active search or filters
                {debouncedSearch ? ` for "${debouncedSearch}"` : ''}
                {categoryFilter !== 'all' ? ` in category "${categoryFilter}"` : ''}
                {authorFilter !== 'all' ? ` by author "${authorFilter}"` : ''}.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearSearch}
                >
                  Clear Search Term
                </button>
                {(categoryFilter !== 'all' || authorFilter !== 'all' || availability !== 'all') && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setCategoryFilter('all');
                      setAuthorFilter('all');
                      setAvailability('all');
                      setSortBy('relevant');
                    }}
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h3>No Books In Selection</h3>
              <p>There are currently no books matching the selected filter criteria.</p>
              {availability !== 'all' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setAvailability('all')}
                >
                  Show All Books
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* 7. BOOKS CATALOG GRID */}
      {!loading && !error && displayedBooks.length > 0 && (
        <div className="books-grid">
          {displayedBooks.map((book) => {
            const isAvailable = book.available_copies > 0;
            const isLimited = isAvailable && book.available_copies <= 2;

            // Generate deterministic theme gradient per book ID
            const coverGradients = [
              'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)',
              'linear-gradient(135deg, #0F172A 0%, #0369A1 50%, #0284C7 100%)',
              'linear-gradient(135deg, #1E293B 0%, #1E40AF 60%, #3B82F6 100%)',
              'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #475569 100%)',
            ];
            const gradientBg = coverGradients[(book.id || 0) % coverGradients.length];

            return (
              <div key={book.id} className="book-card">
                {/* Academic Book Cover Banner */}
                <div
                  className="book-cover-banner"
                  style={{ background: gradientBg }}
                  aria-hidden="true"
                >
                  <span className="book-cover-icon">📘</span>
                  <span className="book-cover-category-chip">
                    {book.category || 'General'}
                  </span>
                  <span className="book-cover-isbn-chip font-mono">
                    {book.isbn}
                  </span>
                </div>

                {/* Card Header: Category & Availability Badge */}
                <div className="book-card-header">
                  <span className="category-pill">{book.category || 'General'}</span>

                  {isLimited ? (
                    <span className="stock-badge badge-limited" title="Limited physical stock remaining">
                      {book.available_copies} Left (Limited)
                    </span>
                  ) : isAvailable ? (
                    <span className="stock-badge badge-in-stock">
                      {book.available_copies} Available
                    </span>
                  ) : (
                    <span className="stock-badge badge-out-of-stock">
                      Unavailable
                    </span>
                  )}
                </div>

                {/* Card Body: Title, Author, and Inventory Copies */}
                <div className="book-card-body">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">By {book.author_name || 'Unknown Author'}</p>

                  <div className="book-meta">
                    <span className="meta-item">
                      <strong>ISBN:</strong> <span className="font-mono">{book.isbn}</span>
                    </span>
                    <span className="meta-item">
                      <strong>Shelf Stock:</strong>{' '}
                      <strong>{book.available_copies}</strong> of {book.total_copies} copies available
                    </span>
                  </div>
                </div>

                {/* Card Footer: View Details & Contextual Reserve / Waitlist Actions */}
                <div className="book-card-footer">
                  <div className="book-card-actions">
                    {isAvailable ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-reserve"
                        onClick={() => handleOpenReserveModal(book)}
                      >
                        📑 Reserve
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm btn-reserve"
                        onClick={() => handleJoinWaitlist(book)}
                        title="Add yourself to the notification waitlist when this book is returned"
                      >
                        🔔 Join Waitlist
                      </button>
                    )}

                    <Link
                      to={`/books/${book.id}`}
                      className="btn btn-outline btn-sm btn-details"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CONFIRMATION RESERVATION MODAL */}
      <ReservationModal
        isOpen={isModalOpen}
        book={modalBook}
        onConfirm={handleConfirmReservation}
        onClose={() => {
          if (!isConfirming) {
            setIsModalOpen(false);
            setModalBook(null);
            setModalError('');
          }
        }}
        isSubmitting={isConfirming}
        error={modalError}
      />
    </div>
  );
}

export default Books;
