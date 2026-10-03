import React from 'react';

/**
 * Reusable BookSearch toolbar component for the Modern Academic Navy theme.
 * Handles search text input, debounce trigger feedback, clear button,
 * availability filter, category filter, author filter, and sorting.
 */
function BookSearch({
  searchTerm,
  onSearchChange,
  onClearSearch,
  availability,
  onAvailabilityChange,
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  authors = [],
  selectedAuthor = 'all',
  onAuthorChange,
  sortBy = 'relevant',
  onSortChange,
  isSearching = false,
  totalResults = 0,
}) {
  return (
    <div className="book-search-container" role="search" aria-label="Book catalog search">
      {/* 1. Main Search Input */}
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="Search by title, ISBN, author, or category..."
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

      {/* 2. Filter Controls Group */}
      <div className="search-filters-wrapper">
        {/* Availability Filter */}
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

        {/* Category Filter */}
        {categories.length > 0 && onCategoryChange && (
          <div className="filter-group">
            <label htmlFor="catalog-category-filter" className="filter-label">
              Category:
            </label>
            <select
              id="catalog-category-filter"
              className="form-select filter-select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Author Filter */}
        {authors.length > 0 && onAuthorChange && (
          <div className="filter-group">
            <label htmlFor="catalog-author-filter" className="filter-label">
              Author:
            </label>
            <select
              id="catalog-author-filter"
              className="form-select filter-select"
              value={selectedAuthor}
              onChange={(e) => onAuthorChange(e.target.value)}
            >
              <option value="all">All Authors</option>
              {authors.map((auth) => (
                <option key={auth.id || auth.name} value={auth.name}>
                  {auth.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sorting Dropdown */}
        {onSortChange && (
          <div className="filter-group">
            <label htmlFor="catalog-sort-filter" className="filter-label">
              Sort:
            </label>
            <select
              id="catalog-sort-filter"
              className="form-select filter-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="relevant">Most Relevant</option>
              <option value="az">A–Z (Title)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        )}
      </div>

      {/* 3. Real-Time Feedback & Result Count */}
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
