import api from './api.js';

export const reservationService = {
  /**
   * Create a new reservation for the authenticated user
   * @param {number|string} bookId
   */
  async createReservation(bookId) {
    const response = await api.post('/reservations', { book_id: Number(bookId) });
    return response;
  },

  /**
   * Get all reservations for the currently authenticated user
   */
  async getMyReservations() {
    const response = await api.get('/reservations');
    return response.reservations || [];
  },

  /**
   * Get specific reservation details by ID
   * @param {number|string} id
   */
  async getReservationById(id) {
    const response = await api.get(`/reservations/${id}`);
    return response.reservation;
  },

  /**
   * Cancel an active reservation and restore inventory
   * @param {number|string} id
   */
  async cancelReservation(id) {
    const response = await api.put(`/reservations/${id}/cancel`, {});
    return response;
  },
};

export default reservationService;
