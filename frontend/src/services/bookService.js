import api from './api.js';

export const bookService = {
  /**
   * Fetch books with optional availability filtering and pagination
   * @param {object} params - { available, page, limit }
   * @param {object} options - Fetch options (e.g. { signal })
   */
  async getBooks(params = {}, options = {}) {
    const query = new URLSearchParams();
    if (params.available !== undefined && params.available !== '' && params.available !== 'all') {
      query.append('available', params.available);
    }
    if (params.page) {
      query.append('page', params.page);
    }
    if (params.limit) {
      query.append('limit', params.limit);
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/books?${queryString}` : '/books';
    const response = await api.get(endpoint, options);
    return response;
  },

  /**
   * Live search books across title, ISBN, author name, and category with optional availability filter
   * @param {string} searchTerm - Search query term
   * @param {object} params - { available }
   * @param {object} options - Fetch options (e.g. { signal })
   */
  async searchBooks(searchTerm, params = {}, options = {}) {
    const query = new URLSearchParams();
    if (searchTerm) {
      query.append('q', searchTerm.trim());
    }
    if (params.available !== undefined && params.available !== '' && params.available !== 'all') {
      query.append('available', params.available);
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/books/search?${queryString}` : '/books/search';
    const response = await api.get(endpoint, options);
    return response;
  },

  /**
   * Fetch single book by ID
   * @param {number|string} id
   * @param {object} options - Fetch options (e.g. { signal })
   */
  async getBookById(id, options = {}) {
    const response = await api.get(`/books/${id}`, options);
    return response.book;
  },
};

export default bookService;
