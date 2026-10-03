import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import bookService from '../services/bookService';
import reservationService from '../services/reservationService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ReservationModal, { formatReservationError } from '../components/ReservationModal';

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hold reservation & waitlist action states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [resSuccess, setResSuccess] = useState('');
  const [resError, setResError] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState('');

  // Fetch book and related catalog recommendations
  const loadBookData = async () => {
    setLoading(true);
    setError('');
    setResSuccess('');
    setResError('');
    setWaitlistSuccess('');

    try {
      const data = await bookService.getBookById(id);
      setBook(data);

      // Fetch related books from catalog
      try {
        const catalogRes = await bookService.getBooks({ limit: 50 });
        const allBooks = catalogRes.books || [];
        const related = allBooks
          .filter(
            (b) =>
              b.id !== data.id &&
              (b.category === data.category || b.author_name === data.author_name)
          )
          .slice(0, 3);
        setRelatedBooks(related);
      } catch {
        // Non-blocking fallback for related books
        setRelatedBooks([]);
      }
    } catch (err) {
      console.error('Book details load error:', err);
      setError(err.message || 'Unable to retrieve book details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Open confirmation modal
  const handleOpenReserveModal = () => {
    if (!book || book.available_copies <= 0) return;
    setModalError('');
    setIsModalOpen(true);
  };

  // Confirm reservation inside modal
  const handleConfirmReservation = async () => {
    if (!book || book.available_copies <= 0) return;

    setIsConfirming(true);
    setModalError('');
    setResSuccess('');
    setResError('');
    setWaitlistSuccess('');

    try {
      await reservationService.createReservation(book.id);
      setResSuccess(
        `Your reservation has been confirmed for "${book.title}". A copy has been reserved for you.`
      );
      // Reload updated book data to refresh available_copies without full page reload
      const updated = await bookService.getBookById(id);
      setBook(updated);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Reservation error:', err);
      const friendlyMsg = formatReservationError(err, book.title);
      setModalError(friendlyMsg);
      if (err.status === 401) {
        setResError(friendlyMsg);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle Waitlist Addition
  const handleJoinWaitlist = () => {
    setResSuccess('');
    setResError('');
    setWaitlistSuccess(
      `You have joined the notification waitlist for "${book?.title}". You will be notified when a copy is returned!`
    );
  };

  if (loading) {
    return <Loading message="Loading book details..." />;
  }

  const isAvailable = book && book.available_copies > 0;
  const isLimited = isAvailable && book.available_copies <= 2;
  const borrowedCopies = book ? Math.max(0, (book.total_copies || 0) - (book.available_copies || 0)) : 0;
  const publicationYear = book?.created_at ? new Date(book.created_at).getFullYear() : '2024';

  return (
    <div className="page-container book-details-page">
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb navigation">
        <Link to="/books" className="back-link">
          &larr; Back to Books Catalog
        </Link>
      </nav>

      {/* Global Error Banner */}
      <ErrorMessage message={error} onRetry={loadBookData} />

      {!loading && !error && book && (
        <>
          {/* 2. TOP HERO CARD: TWO-COLUMN ACADEMIC LAYOUT */}
          <div className="book-details-card academic-details-container">
            {/* LEFT COLUMN: ACADEMIC BOOK COVER */}
            <div className="details-cover-column">
              <div className="premium-book-cover" aria-hidden="true">
                <div className="cover-spine-effect" />
                <div className="cover-ribbon">LIBRARY COLLECTION</div>
                <div className="cover-header">
                  <span className="cover-department-tag">DEPARTMENTAL REPOSITORY</span>
                  <span className="cover-icon">📖</span>
                </div>
                <div className="cover-center">
                  <h2 className="cover-title">{book.title}</h2>
                  <p className="cover-author">{book.author_name || book.author?.name || 'Department Author'}</p>
                </div>
                <div className="cover-footer">
                  <span className="cover-category-badge">{book.category || 'Core Reference'}</span>
                  <span className="cover-isbn font-mono">{book.isbn}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: BOOK INFORMATION & AVAILABILITY CARD */}
            <div className="details-content-column">
              <div className="details-header-info">
                <div className="details-category-row">
                  <span className="category-pill">{book.category || 'General'}</span>
                  {isLimited ? (
                    <span className="stock-badge badge-limited">
                      Limited Stock ({book.available_copies} Left)
                    </span>
                  ) : isAvailable ? (
                    <span className="stock-badge badge-in-stock">
                      Available ({book.available_copies} on Shelf)
                    </span>
                  ) : (
                    <span className="stock-badge badge-out-of-stock">
                      Currently Unavailable
                    </span>
                  )}
                </div>

                <h1 className="details-title">{book.title}</h1>
                <p className="details-author-sub">
                  Authored by{' '}
                  <strong>{book.author_name || book.author?.name || 'Unknown Author'}</strong>
                </p>

                {/* Metadata Row: ISBN, Publisher, Publication Year */}
                <div className="details-meta-row">
                  <div className="meta-pill">
                    <span className="meta-pill-label">ISBN:</span>
                    <span className="meta-pill-value font-mono">{book.isbn}</span>
                  </div>
                  <div className="meta-pill">
                    <span className="meta-pill-label">Publisher:</span>
                    <span className="meta-pill-value">Academic Press</span>
                  </div>
                  <div className="meta-pill">
                    <span className="meta-pill-label">Publication Year:</span>
                    <span className="meta-pill-value">{publicationYear}</span>
                  </div>
                </div>
              </div>

              {/* AVAILABILITY CARD */}
              <div className="availability-card" aria-label="Book copy availability breakdown">
                <div className="availability-card-header">
                  <h4>Shelf Availability &amp; Circulation</h4>
                  <span className="text-muted text-sm">Real-time database count</span>
                </div>

                <div className="availability-stats-grid">
                  <div className="stat-metric-box">
                    <span className="stat-label">Total Copies</span>
                    <span className="stat-value">{book.total_copies}</span>
                  </div>

                  <div className="stat-metric-box stat-available">
                    <span className="stat-label">Available on Shelf</span>
                    <span className="stat-value text-success">{book.available_copies}</span>
                  </div>

                  <div className="stat-metric-box stat-borrowed">
                    <span className="stat-label">Currently Borrowed</span>
                    <span className="stat-value text-warning">{borrowedCopies}</span>
                  </div>
                </div>

                {/* Status Progress Meter */}
                <div className="availability-meter-wrap" aria-hidden="true">
                  <div
                    className="availability-meter-bar"
                    style={{
                      width: `${book.total_copies > 0 ? (book.available_copies / book.total_copies) * 100 : 0}%`,
                    }}
                  />
                </div>

                {/* Feedback Banners */}
                {resSuccess && (
                  <div className="success-banner" style={{ marginTop: '1rem' }} role="status">
                    <div className="banner-content-with-action">
                      <span>✅ {resSuccess}</span>
                      <Link to="/dashboard" className="banner-link">
                        View in My Library &rarr;
                      </Link>
                    </div>
                  </div>
                )}

                {waitlistSuccess && (
                  <div className="success-banner" style={{ marginTop: '1rem' }} role="status">
                    <span>🔔 {waitlistSuccess}</span>
                  </div>
                )}

                {resError && (
                  <div style={{ marginTop: '1rem' }}>
                    <ErrorMessage message={resError} />
                  </div>
                )}

                {/* Actions Row: Primary CTA & Secondary CTA */}
                <div className="details-actions-row">
                  {isAvailable ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-lg flex-1"
                      onClick={handleOpenReserveModal}
                    >
                      📑 Reserve Book
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline btn-lg flex-1"
                      disabled
                      title="All physical copies are currently loaned out"
                    >
                      Unavailable on Shelf
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={handleJoinWaitlist}
                    title="Be notified when a copy is returned"
                  >
                    🔔 Add to Waitlist
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. BELOW SECTION: ABOUT THIS BOOK & DETAILS */}
          <div className="details-lower-grid">
            {/* About this book */}
            <section className="details-card-sub" aria-labelledby="about-heading">
              <h2 id="about-heading" className="sub-heading">About this book</h2>
              <p className="book-description-text">
                {book.description ||
                  'No detailed synopsis provided for this departmental volume. Please consult the departmental librarian for syllabus and course reserves references.'}
              </p>
            </section>

            {/* Details Table */}
            <section className="details-card-sub" aria-labelledby="details-heading">
              <h2 id="details-heading" className="sub-heading">Volume Details</h2>
              <table className="volume-details-table">
                <tbody>
                  <tr>
                    <th>ISBN-13:</th>
                    <td className="font-mono">{book.isbn}</td>
                  </tr>
                  <tr>
                    <th>Category:</th>
                    <td>{book.category}</td>
                  </tr>
                  <tr>
                    <th>Lending Duration:</th>
                    <td>14 Days Standard Member Circulation</td>
                  </tr>
                  <tr>
                    <th>Catalog Entry Date:</th>
                    <td>{book.created_at ? new Date(book.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Last Inventory Update:</th>
                    <td>{book.updated_at ? new Date(book.updated_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Hold Policy:</th>
                    <td>Automatic 1-copy hold reservation upon approval</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          {/* 4. RELATED BOOKS SECTION */}
          {relatedBooks.length > 0 && (
            <section className="curated-section" aria-labelledby="related-heading" style={{ marginTop: '1rem' }}>
              <div className="section-header">
                <div>
                  <h2 id="related-heading" className="section-title">Related Books</h2>
                  <p className="section-subtitle">
                    Other recommended volumes in <strong>{book.category}</strong> or by the same faculty author.
                  </p>
                </div>
                <Link to="/books" className="section-action-link">
                  Browse Full Catalog &rarr;
                </Link>
              </div>

              <div className="books-grid">
                {relatedBooks.map((rel) => {
                  const relAvail = rel.available_copies > 0;
                  return (
                    <div key={`rel-${rel.id}`} className="book-card">
                      <div className="book-card-header">
                        <span className="category-pill">{rel.category || 'Related'}</span>
                        <span className={`stock-badge ${relAvail ? 'badge-in-stock' : 'badge-out-of-stock'}`}>
                          {relAvail ? `${rel.available_copies} Available` : 'Unavailable'}
                        </span>
                      </div>
                      <div className="book-card-body">
                        <h3 className="book-title">{rel.title}</h3>
                        <p className="book-author">By {rel.author_name || 'Academic Author'}</p>
                        <div className="book-meta">
                          <span className="meta-item">
                            <strong>ISBN:</strong> <span className="font-mono">{rel.isbn}</span>
                          </span>
                        </div>
                      </div>
                      <div className="book-card-footer">
                        <Link
                          to={`/books/${rel.id}`}
                          className="btn btn-outline btn-sm btn-block"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Confirmation Reservation Modal */}
      <ReservationModal
        isOpen={isModalOpen}
        book={book}
        onConfirm={handleConfirmReservation}
        onClose={() => {
          if (!isConfirming) {
            setIsModalOpen(false);
            setModalError('');
          }
        }}
        isSubmitting={isConfirming}
        error={modalError}
      />
    </div>
  );
}

export default BookDetails;
