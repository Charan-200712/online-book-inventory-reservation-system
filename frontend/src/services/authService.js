import api from './api.js';

export const authService = {
  /**
   * Register a new user
   * @param {object} userData - { name, email, password }
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  /**
   * Log in user with credentials
   * @param {object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response;
  },

  /**
   * Log out user
   */
  async logout() {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Backend logout is stateless; even if the network call fails, client-side state will be cleared
    }
  },

  /**
   * Fetch current authenticated user profile
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.user;
  },
};

export default authService;
