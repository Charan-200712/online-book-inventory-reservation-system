import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import bookService from '../services/bookService';
import reservationService from '../services/reservationService';
import BookSearch from '../components/BookSearch';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function Books() {
  const [searchParams] = useSearchParams();
  const initialAvailable = searchParams.get('available') === 'true' ? 'true' : 'all';

  // Controlled form & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [availability, setAvailability] = useState(initialAvailable);

  // Async data & lifecycle states
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Reservation feedback state
  const [reservingId, setReservingId] = useState(null);
  const [resSuccess, setResSuccess] = useState('');
  const [resError, setResError] = useState('');

  // 1. Debounce Effect: Synchronize user typing with debouncedSearch (400ms delay)
  useEffect(() => {
    // Show immediate feedback when user is typing
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

  // Handler: Direct book reservation from catalog card
  const handleReserve = async (book) => {
    setReservingId(book.id);
    setResSuccess('');
    setResError('');

    try {
      await reservationService.createReservation(book.id);
      setResSuccess(
        `Successfully placed a hold for "${book.title}"! A copy has been reserved for you.`
      );
      // Instantaneously update local copy count
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id
            ? { ...b, available_copies: Math.max(0, b.available_copies - 1) }
            : b
        )
      );
    } catch (err) {
      console.error('Reservation error:', err);
      if (err.status === 409) {
        setResError(`You already have an active reservation for "${book.title}".`);
      } else {
        setResError(err.message || 'Unable to reserve book. Please try again.');
      }
    } finally {
      setReservingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Library Book Inventory</h1>
        <p className="page-subtitle">
          Search across title, ISBN, author name, or category with real-time stock availability and instant hold reservation.
        </p>

        {/* Integrated Controlled Search & Filter Toolbar */}
        <BookSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={handleClearSearch}
          availability={availability}
          onAvailabilityChange={setAvailability}
          isSearching={isSearching && !loading}
          totalResults={books.length}
        />
      </div>

      {/* Reservation Action Feedback Banners */}
      {resSuccess && (
        <div className="success-banner" role="status">
          <div className="banner-content-with-action">
            <span>✅ {resSuccess}</span>
            <Link to="/dashboard" className="banner-link">
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

      {loading && <Loading message="Loading book inventory..." />}

      <ErrorMessage
        message={error}
        onRetry={() => {
          setLoading(true);
          setDebouncedSearch((prev) => prev);
        }}
      />

      {/* Empty State Display */}
      {!loading && !error && books.length === 0 && (
        <div className="empty-state" role="status">
          <span className="empty-icon" aria-hidden="true">
            📭
          </span>
          {debouncedSearch ? (
            <>
              <h3>No Books Found</h3>
              <p>
                No books matched your search for <strong>"{debouncedSearch}"</strong>
                {availability !== 'all' ? ` with ${availability === 'true' ? 'available' : 'unavailable'} stock` : ''}.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1rem' }}
                onClick={handleClearSearch}
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <h3>No Books In Selection</h3>
              <p>There are currently no books matching the selected availability filter.</p>
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

      {/* Books Grid */}
      {!loading && !error && books.length > 0 && (
        <div className="books-grid">
          {books.map((book) => {
            const isAvailable = book.available_copies > 0;
            return (
              <div key={book.id} className="book-card">
                <div className="book-card-header">
                  <span className="category-pill">{book.category || 'General'}</span>
                  <span
                    className={`stock-badge ${isAvailable ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                  >
                    {isAvailable ? `${book.available_copies} Available` : 'Unavailable'}
                  </span>
                </div>

                <div className="book-card-body">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">By {book.author_name || 'Unknown Author'}</p>
                  <div className="book-meta">
                    <span className="meta-item">
                      <strong>ISBN:</strong> <span className="font-mono">{book.isbn}</span>
                    </span>
                    <span className="meta-item">
                      <strong>Total Copies:</strong> {book.total_copies}
                    </span>
                    <span className="meta-item">
                      <strong>Available Copies:</strong> {book.available_copies}
                    </span>
                  </div>
                </div>

                <div className="book-card-footer">
                  <div className="book-card-actions">
                    {isAvailable ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-reserve"
                        onClick={() => handleReserve(book)}
                        disabled={reservingId === book.id}
                      >
                        {reservingId === book.id ? 'Reserving...' : '📑 Reserve'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-reserve"
                        disabled
                        title="No copies currently available"
                      >
                        Unavailable
                      </button>
                    )}
                    <Link to={`/books/${book.id}`} className="btn btn-outline btn-sm btn-details">
                      Details &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Books;
