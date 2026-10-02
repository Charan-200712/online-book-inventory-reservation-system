import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login page, preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h2>Access Restricted</h2>
        <p>Your account ({user?.role}) does not have permission to view this section.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
