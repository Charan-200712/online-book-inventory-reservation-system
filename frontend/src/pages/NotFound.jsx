import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-text">
          The requested page does not exist or may have been relocated.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
          <Link to="/books" className="btn btn-secondary">
            Browse Books
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
