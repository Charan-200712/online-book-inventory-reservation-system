import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import bookService from '../services/bookService';
import authorService from '../services/authorService';

function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Live real data metrics & collections
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalBooks: 0,
    totalAuthors: 0,
    availableCopies: 0,
    activeReservations: 0,
  });
  const [popularBooks, setPopularBooks] = useState([]);
  const [recentlyAddedBooks, setRecentlyAddedBooks] = useState([]);

  // Fetch real backend data on mount
  useEffect(() => {
    let isSubscribed = true;

    async function fetchLibraryData() {
      setLoading(true);
      try {
        let booksList = [];
        let authorsList = [];
        let reservationsCount = 0;

        if (isAuthenticated) {
          // If authenticated, fetch full catalog and author records
          try {
            const [booksRes, authorsRes] = await Promise.all([
              bookService.getBooks({ limit: 100 }),
              authorService.getAuthors(),
            ]);
            booksList = booksRes.books || [];
            authorsList = authorsRes || [];

            // If user or admin has reservations, derive count
            const resData = await api.get('/reservations').catch(() => null);
            if (resData && resData.data) {
              const resList = resData.data.reservations || resData.data || [];
              reservationsCount = Array.isArray(resList)
                ? resList.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED').length
                : 0;
            }
          } catch {
            // Fallback to sample-left-join if any call fails
            const sampleRes = await api.get('/books/sample-left-join');
            booksList = sampleRes.data || [];
          }
        } else {
          // Unauthenticated public visitors: fetch from public relational join endpoint
          const sampleRes = await api.get('/books/sample-left-join');
          booksList = sampleRes.data || [];
        }

        if (isSubscribed && booksList.length > 0) {
          // Compute real metrics from backend dataset
          const totalBooksCount = booksList.length;
          const uniqueAuthors = authorsList.length > 0
            ? authorsList.length
            : new Set(booksList.map((b) => b.author_name).filter(Boolean)).size;

          const totalAvailable = booksList.reduce(
            (sum, b) => sum + (Number(b.available_copies) || 0),
            0
          );
          const totalCopies = booksList.reduce(
            (sum, b) => sum + (Number(b.total_copies) || 0),
            0
          );
          const estimatedActiveHolds = reservationsCount > 0
            ? reservationsCount
            : Math.max(0, totalCopies - totalAvailable);

          setMetrics({
            totalBooks: totalBooksCount,
            totalAuthors: uniqueAuthors,
            availableCopies: totalAvailable,
            activeReservations: estimatedActiveHolds,
          });

          // Popular books: sorted by highest demand (lowest available ratio or highest borrowed)
          const sortedByPopularity = [...booksList].sort((a, b) => {
            const aBorrowed = (a.total_copies || 1) - (a.available_copies || 0);
            const bBorrowed = (b.total_copies || 1) - (b.available_copies || 0);
            return bBorrowed - aBorrowed;
          });
          setPopularBooks(sortedByPopularity.slice(0, 4));

          // Recently added books: latest entries in catalog
          const sortedByRecent = [...booksList].sort((a, b) => Number(b.id) - Number(a.id));
          setRecentlyAddedBooks(sortedByRecent.slice(0, 4));
        }
      } catch (err) {
        console.error('Error loading library discovery data:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchLibraryData();

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/books?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/books');
    }
  };

  return (
    <div className="home-container">
      {/* 1. HERO SECTION */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="badge hero-badge">Departmental Library System</div>

        <h1 id="hero-heading" className="hero-title">
          Your Departmental Library
        </h1>

        <p className="hero-subheading">
          Find. Reserve. Learn.
        </p>

        <p className="hero-description">
          Discover departmental books, check real-time availability, and manage your reservations and loans in one place.
        </p>

        {/* 2. LARGE SEARCH BAR */}
        <form className="hero-search-form" onSubmit={handleSearchSubmit} role="search">
          <div className="hero-search-input-wrap">
            <span className="hero-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search books, authors, ISBN, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search books, authors, ISBN, or category"
            />
            {searchQuery && (
              <button
                type="button"
                className="hero-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                &times;
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary hero-search-btn">
            Search Catalog
          </button>
        </form>

        {/* 3. PRIMARY ACTIONS */}
        <div className="hero-actions">
          <Link to="/books" className="btn btn-primary btn-lg">
            Browse Books &rarr;
          </Link>
          <Link to="/authors" className="btn btn-secondary btn-lg">
            Explore Authors
          </Link>
        </div>

        {isAuthenticated && user && (
          <div className="welcome-banner" role="status">
            <span>
              Signed in as <strong>{user.name}</strong> ({user.role === 'ADMIN' ? 'Administrator' : 'Department Member'})
            </span>
          </div>
        )}
      </section>

      {/* 4. LIBRARY AT A GLANCE (REAL METRICS) */}
      <section className="glance-section" aria-labelledby="glance-heading">
        <div className="section-header">
          <div>
            <h2 id="glance-heading" className="section-title">Library at a Glance</h2>
            <p className="section-subtitle">Real-time statistics across departmental collections and active circulation.</p>
          </div>
        </div>

        <div className="glance-grid">
          <div className="glance-card">
            <div className="glance-icon-wrap icon-blue">
              <span className="glance-icon" aria-hidden="true">📚</span>
            </div>
            <div className="glance-content">
              <span className="glance-number">
                {loading ? '...' : metrics.totalBooks}
              </span>
              <span className="glance-label">Total Titles</span>
            </div>
          </div>

          <div className="glance-card">
            <div className="glance-icon-wrap icon-navy">
              <span className="glance-icon" aria-hidden="true">✍️</span>
            </div>
            <div className="glance-content">
              <span className="glance-number">
                {loading ? '...' : metrics.totalAuthors}
              </span>
              <span className="glance-label">Registered Authors</span>
            </div>
          </div>

          <div className="glance-card">
            <div className="glance-icon-wrap icon-green">
              <span className="glance-icon" aria-hidden="true">📦</span>
            </div>
            <div className="glance-content">
              <span className="glance-number">
                {loading ? '...' : metrics.availableCopies}
              </span>
              <span className="glance-label">Available Copies</span>
            </div>
          </div>

          <div className="glance-card">
            <div className="glance-icon-wrap icon-amber">
              <span className="glance-icon" aria-hidden="true">📑</span>
            </div>
            <div className="glance-content">
              <span className="glance-number">
                {loading ? '...' : metrics.activeReservations}
              </span>
              <span className="glance-label">Active Holds &amp; Loans</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. POPULAR BOOKS */}
      <section className="curated-section" aria-labelledby="popular-heading">
        <div className="section-header">
          <div>
            <h2 id="popular-heading" className="section-title">Popular Books</h2>
            <p className="section-subtitle">Frequently reserved volumes in computer science and software engineering.</p>
          </div>
          <Link to="/books" className="section-action-link">
            View All Catalog &rarr;
          </Link>
        </div>

        <div className="books-grid">
          {popularBooks.map((book) => {
            const isAvailable = book.available_copies > 0;
            return (
              <div key={`pop-${book.id}`} className="book-card">
                <div className="book-card-header">
                  <span className="category-pill">{book.category || 'Core Engineering'}</span>
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
                      <strong>Total Inventory:</strong> {book.total_copies} copies
                    </span>
                  </div>
                </div>

                <div className="book-card-footer">
                  <div className="book-card-actions">
                    <Link
                      to={`/books/${book.id}`}
                      className="btn btn-primary btn-sm btn-block"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. RECENTLY ADDED */}
      <section className="curated-section" aria-labelledby="recent-heading">
        <div className="section-header">
          <div>
            <h2 id="recent-heading" className="section-title">Recently Added</h2>
            <p className="section-subtitle">Latest cataloged reference materials, algorithms, and system architecture books.</p>
          </div>
          <Link to="/books" className="section-action-link">
            Explore All &rarr;
          </Link>
        </div>

        <div className="books-grid">
          {recentlyAddedBooks.map((book) => {
            const isAvailable = book.available_copies > 0;
            return (
              <div key={`rec-${book.id}`} className="book-card">
                <div className="book-card-header">
                  <span className="category-pill">{book.category || 'Academic Catalog'}</span>
                  <span
                    className={`stock-badge ${isAvailable ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                  >
                    {isAvailable ? `${book.available_copies} in stock` : 'Checked out'}
                  </span>
                </div>

                <div className="book-card-body">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">By {book.author_name || 'Department Author'}</p>
                  <div className="book-meta">
                    <span className="meta-item">
                      <strong>ISBN:</strong> <span className="font-mono">{book.isbn}</span>
                    </span>
                    <span className="meta-item">
                      <strong>Available:</strong> {book.available_copies} / {book.total_copies}
                    </span>
                  </div>
                </div>

                <div className="book-card-footer">
                  <div className="book-card-actions">
                    <Link
                      to={`/books/${book.id}`}
                      className="btn btn-secondary btn-sm btn-block"
                    >
                      Inspect Volume &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Home;
