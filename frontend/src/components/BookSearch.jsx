import React from 'react';

/**
 * Reusable BookSearch toolbar component
 * Handles search text input, debounce trigger feedback, clear button, and availability filter.
 */
function BookSearch({
  searchTerm,
  onSearchChange,
  onClearSearch,
  availability,
  onAvailabilityChange,
  isSearching = false,
  totalResults = 0,
}) {
  return (
    <div className="book-search-container" role="search" aria-label="Book catalog search">
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="Search books by title, ISBN, author, or category..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search books by title, ISBN, author, or category"
        />
        {searchTerm && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={onClearSearch}
            aria-label="Clear search input"
            title="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      <div className="search-filters-wrapper">
        <div className="filter-group">
          <label htmlFor="catalog-availability-filter" className="filter-label">
            Availability:
          </label>
          <select
            id="catalog-availability-filter"
            className="form-select filter-select"
            value={availability}
            onChange={(e) => onAvailabilityChange(e.target.value)}
          >
            <option value="all">All Books</option>
            <option value="true">Available Only</option>
            <option value="false">Unavailable Only</option>
          </select>
        </div>
      </div>

      <div className="search-feedback-wrapper" aria-live="polite">
        {isSearching ? (
          <span className="searching-indicator">
            <span className="spinner-dots"></span> Searching...
          </span>
        ) : (
          <span className="results-count-badge">
            {totalResults} {totalResults === 1 ? 'book' : 'books'} {searchTerm.trim() ? 'found' : 'in catalog'}
          </span>
        )}
      </div>
    </div>
  );
}

export default BookSearch;
