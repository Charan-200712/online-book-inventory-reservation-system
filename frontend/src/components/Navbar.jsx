import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on route changes
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Click outside listener for user dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon" aria-hidden="true">📚</span>
          <span className="brand-text">Departmental Library</span>
        </Link>

        {/* Primary Navigation Links */}
        <nav className="navbar-nav" aria-label="Main Navigation">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end
          >
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/books"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Books
              </NavLink>
              <NavLink
                to="/authors"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Authors
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive || location.pathname === '/my-library' ? 'nav-link active' : 'nav-link'
                }
              >
                My Library
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Admin
                </NavLink>
              )}
            </>
          ) : null}
        </nav>

        {/* Right Side: Notifications & User Profile */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              {/* Notification Center */}
              <NotificationCenter />

              {/* User Avatar, Name & Dropdown */}
              <div className="user-menu-wrap" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-menu-trigger"
                  onClick={() => {
                    setUserMenuOpen((prev) => !prev);
                    setNotificationsOpen(false);
                  }}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="user-avatar-circle" aria-hidden="true">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="user-name-label">{user?.name || 'User'}</span>
                  <span className="user-menu-chevron" aria-hidden="true">▼</span>
                </button>

                {userMenuOpen && (
                  <div className="user-menu-dropdown" role="menu">
                    <div className="dropdown-user-header">
                      <p className="dropdown-user-name">{user?.name}</p>
                      <p className="dropdown-user-email">{user?.email}</p>
                      <span
                        className={`badge ${user?.role === 'ADMIN' ? 'badge-admin' : 'badge-in-stock'}`}
                        style={{ marginTop: '0.4rem' }}
                      >
                        {user?.role === 'ADMIN' ? 'Administrator' : 'Department Member'}
                      </span>
                    </div>

                    <Link to="/dashboard" className="dropdown-item" role="menuitem">
                      <span>📖</span> My Library
                    </Link>
                    <Link to="/dashboard" className="dropdown-item" role="menuitem">
                      <span>📑</span> My Reservations
                    </Link>
                    <Link to="/dashboard" className="dropdown-item" role="menuitem">
                      <span>📂</span> My Loans
                    </Link>

                    {user?.role === 'ADMIN' && (
                      <Link to="/admin" className="dropdown-item" role="menuitem">
                        <span>👑</span> Admin Management
                      </Link>
                    )}

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="dropdown-item danger logout-btn"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="nav-auth-section">
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="btn btn-primary btn-sm"
              >
                Register
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
