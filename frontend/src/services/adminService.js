import api from './api.js';

export const adminService = {
  // --- Book Management ---
  async createBook(bookData) {
    const response = await api.post('/books', bookData);
    return response;
  },

  async updateBook(id, bookData) {
    const response = await api.put(`/books/${id}`, bookData);
    return response;
  },

  async deleteBook(id) {
    const response = await api.delete(`/books/${id}`);
    return response;
  },

  // --- Author Management ---
  async createAuthor(authorData) {
    const response = await api.post('/authors', authorData);
    return response;
  },

  async updateAuthor(id, authorData) {
    const response = await api.put(`/authors/${id}`, authorData);
    return response;
  },

  async deleteAuthor(id) {
    const response = await api.delete(`/authors/${id}`);
    return response;
  },

  // --- System-wide Reservation Management ---
  async getAllReservations() {
    const response = await api.get('/reservations/all');
    return response.reservations || [];
  },

  async approveReservation(id) {
    const response = await api.put(`/reservations/${id}/approve`, {});
    return response;
  },

  // --- System-wide Circulation Transactions ---
  async getAllTransactions() {
    const response = await api.get('/transactions/all');
    return response.transactions || [];
  },

  async getOverdueTransactions() {
    const response = await api.get('/transactions/overdue');
    return response.overdueTransactions || [];
  },
};

export default adminService;
