import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import authorService from '../services/authorService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function Authors() {
  const [authors, setAuthors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAuthors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authorService.getAuthors();
      setAuthors(data || []);
    } catch (err) {
      setError(err.message || 'Unable to load authors list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
  }, []);

  const filteredAuthors = useMemo(() => {
    if (!searchTerm.trim()) return authors;
    const query = searchTerm.toLowerCase();
    return authors.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        (a.biography && a.biography.toLowerCase().includes(query))
    );
  }, [authors, searchTerm]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Featured Authors</h1>
        <p className="page-subtitle">
          Prominent computer scientists, engineers, and educators featured across our departmental collection.
        </p>

        {/* Search Toolbar */}
        {!loading && !error && authors.length > 0 && (
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Search authors by name or research field..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search authors"
              />
              <span
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
            <span className="badge badge-in-stock" style={{ fontSize: '0.75rem' }}>
              {filteredAuthors.length} {filteredAuthors.length === 1 ? 'Author' : 'Authors'}
            </span>
          </div>
        )}
      </div>

      {loading && <Loading message="Loading authors directory..." />}

      <ErrorMessage message={error} onRetry={loadAuthors} />

      {/* Global Empty State */}
      {!loading && !error && authors.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">✍️</span>
          <h3>No Authors Found</h3>
          <p>No authors have been registered in the catalog yet.</p>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && !error && authors.length > 0 && filteredAuthors.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">🔍</span>
          <h3>No Matching Authors</h3>
          <p>No authors found matching "{searchTerm}". Try adjusting your keywords.</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ marginTop: '0.75rem' }}
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Authors Grid */}
      {!loading && !error && filteredAuthors.length > 0 && (
        <div className="authors-grid">
          {filteredAuthors.map((author) => (
            <div key={author.id} className="author-card">
              <div className="author-avatar" aria-hidden="true">
                {author.name.charAt(0).toUpperCase()}
              </div>
              <div className="author-info">
                <h3 className="author-name">{author.name}</h3>
                <p className="author-bio">
                  {author.biography || 'Distinguished academic author in departmental repository.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.85rem' }}>
                  <span className="author-date" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Cataloged: {author.created_at ? new Date(author.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '—'}
                  </span>
                  <Link
                    to={`/books?q=${encodeURIComponent(author.name)}`}
                    className="btn btn-outline btn-xs"
                    title={`Browse catalog titles by ${author.name}`}
                  >
                    Browse Books &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Authors;
