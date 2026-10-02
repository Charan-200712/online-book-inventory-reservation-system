import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') || null : null
  );
  const [loading, setLoading] = useState(true);

  // Restore authenticated user on app initialization
  const restoreUser = useCallback(async () => {
    const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setToken(storedToken);
    } catch (error) {
      console.warn('Session expired or token invalid. Clearing auth state.');
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreUser();
  }, [restoreUser]);

  // Listen for mid-flight 401 Unauthorized events from api.js
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('Authentication session expired. Clearing state and prompting sign in.');
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
      setToken(null);
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => {
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
      };
    }
  }, []);

  // Login handler
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data.token && data.user) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  // Register handler
  const register = async (userData) => {
    const data = await authService.register(userData);
    return data;
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
