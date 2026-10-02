import React, { useState, useEffect } from 'react';
import authorService from '../services/authorService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

function Authors() {
  const [authors, setAuthors] = useState([]);
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Featured Authors</h1>
        <p className="page-subtitle">
          Prominent computer scientists, engineers, and educators featured in our library catalog.
        </p>
      </div>

      {loading && <Loading message="Loading authors directory..." />}

      <ErrorMessage message={error} onRetry={loadAuthors} />

      {!loading && !error && authors.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">✍️</span>
          <h3>No Authors Found</h3>
          <p>No authors have been registered in the database yet.</p>
        </div>
      )}

      {!loading && !error && authors.length > 0 && (
        <div className="authors-grid">
          {authors.map((author) => (
            <div key={author.id} className="author-card">
              <div className="author-avatar" aria-hidden="true">
                {author.name.charAt(0).toUpperCase()}
              </div>
              <div className="author-info">
                <h3 className="author-name">{author.name}</h3>
                <p className="author-bio">
                  {author.biography || 'No biography recorded for this author.'}
                </p>
                <span className="author-date">
                  Recorded: {author.created_at ? new Date(author.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Authors;
