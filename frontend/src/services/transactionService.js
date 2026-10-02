import api from './api.js';

export const transactionService = {
  /**
   * Get all circulation transactions for the currently authenticated user
   */
  async getMyTransactions() {
    const response = await api.get('/transactions');
    return response.transactions || [];
  },
};

export default transactionService;
