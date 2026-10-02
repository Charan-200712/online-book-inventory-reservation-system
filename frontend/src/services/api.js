/**
 * Centralized API Client
 * Manages HTTP communication, headers, JWT authorization, network error translation,
 * and session expiration events.
 */

const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseUrl().replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Perform an HTTP request to the API backend
 * @param {string} endpoint - Path relative to base URL (e.g. '/books')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 */
export async function apiRequest(endpoint, options = {}) {
  const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const url = isAbsoluteUrl
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  // Attach stored JWT if available and not explicitly provided
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-encode JSON body if an object is passed
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      // Handle JWT expiration / invalid session mid-flight
      if (response.status === 401 && token) {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }

      let message =
        data?.message ||
        data?.errors?.[0]?.msg ||
        data?.error;

      if (!message) {
        if (response.status === 401) {
          message = 'Authentication required. Please sign in to continue.';
        } else if (response.status === 403) {
          message = 'You are not authorized to perform this action.';
        } else if (response.status === 404) {
          message = 'The requested resource was not found.';
        } else if (response.status === 409) {
          message = 'A business conflict occurred with this request.';
        } else if (response.status >= 500) {
          message = 'A server error occurred. Please try again later.';
        } else {
          message = `HTTP Error ${response.status}: ${response.statusText}`;
        }
      }

      throw new ApiError(message, response.status, data);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof ApiError) {
      throw error;
    }

    // Network failures (server down, connection refused, offline)
    const isNetworkError =
      error instanceof TypeError ||
      (error.message && (
        error.message.includes('fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('ECONNREFUSED')
      ));

    const friendlyMessage = isNetworkError
      ? 'Unable to connect to the server. Please check that the backend is running and try again.'
      : (error.message || 'An unexpected error occurred. Please try again.');

    throw new ApiError(friendlyMessage, 0, null);
  }
}

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
