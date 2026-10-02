import api from './api.js';

export const bookService = {
  /**
   * Fetch books with optional filtering and pagination
   * @param {object} params - { available, page, limit }
   */
  async getBooks(params = {}) {
    const query = new URLSearchParams();
    if (params.available !== undefined && params.available !== '') {
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
    const response = await api.get(endpoint);
    return response;
  },

  /**
   * Fetch single book by ID
   * @param {number|string} id
   */
  async getBookById(id) {
    const response = await api.get(`/books/${id}`);
    return response.book;
  },
};

export default bookService;
