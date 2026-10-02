import api from './api.js';

export const authorService = {
  /**
   * Fetch all authors
   */
  async getAuthors() {
    const response = await api.get('/authors');
    return response.authors || [];
  },

  /**
   * Fetch single author by ID
   * @param {number|string} id
   */
  async getAuthorById(id) {
    const response = await api.get(`/authors/${id}`);
    return response.author;
  },
};

export default authorService;
