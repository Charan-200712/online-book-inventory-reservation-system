import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📚</span>
          <span className="brand-text">Departmental Library</span>
        </Link>

        <nav className="navbar-nav">
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
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Dashboard
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Admin
                </NavLink>
              )}

              <div className="nav-user-section">
                <span className="user-greeting">
                  Hello, <strong>{user?.name || 'User'}</strong>
                </span>
                {user?.role === 'ADMIN' && (
                  <span className="badge badge-admin" title="Administrator Privileges">
                    Admin
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-sm logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
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
                className={({ isActive }) => (isActive ? 'btn btn-primary btn-sm' : 'btn btn-primary btn-sm')}
              >
                Register
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
