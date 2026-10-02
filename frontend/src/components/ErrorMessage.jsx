import React from 'react';

function ErrorMessage({ message = 'An unexpected error occurred.', onRetry }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <div className="error-content">
        <span className="error-icon" aria-hidden="true">⚠️</span>
        <span className="error-text">{message}</span>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
