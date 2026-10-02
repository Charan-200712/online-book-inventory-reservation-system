/**
 * Centralized API Client
 * Manages HTTP communication, headers, JWT authorization, and error extraction.
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
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  // Attach stored JWT if available and not explicitly provided
  const token = localStorage.getItem('token');
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
      const message =
        data?.message ||
        data?.errors?.[0]?.msg ||
        data?.error ||
        `HTTP Error ${response.status}: ${response.statusText}`;

      throw new ApiError(message, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other unforeseen errors
    throw new ApiError(
      error.message || 'Unable to connect to the server. Please check your network or try again.',
      0,
      null
    );
  }
}

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
