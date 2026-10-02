import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="badge hero-badge">Departmental Library System</div>
        <h1 className="hero-title">Online Book Inventory &amp; Reservation System</h1>
        <p className="hero-description">
          A centralized platform for students and faculty to explore departmental library collections,
          check real-time stock availability, and manage book reservations and loans.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <>
              <Link to="/books" className="btn btn-primary btn-lg">
                Explore Books Catalog &rarr;
              </Link>
              <Link to="/authors" className="btn btn-secondary btn-lg">
                View Authors
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary btn-lg">
                Sign In to Your Account
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                Create an Account
              </Link>
            </>
          )}
        </div>

        {isAuthenticated && user && (
          <div className="welcome-banner">
            <p>
              Welcome back, <strong>{user.name}</strong>! You are signed in as{' '}
              <span className="user-role-tag">{user.role}</span>.
            </p>
          </div>
        )}
      </section>

      <section className="features-grid">
        <Link to="/books" className="feature-card">
          <div className="feature-icon">📖</div>
          <h3>Inventory Tracking</h3>
          <p>
            Real-time tracking of total and available copies across computer science and engineering disciplines.
          </p>
          <div className="feature-card-action">Browse Catalog &rarr;</div>
        </Link>
        <Link to="/books?available=true" className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Instant Availability</h3>
          <p>
            Inspect whether physical copies are on shelf or currently checked out by departmental members.
          </p>
          <div className="feature-card-action">View In-Stock Titles &rarr;</div>
        </Link>
        <Link to={isAuthenticated ? "/dashboard" : "/login"} className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure Reservations</h3>
          <p>
            Guaranteed concurrency-safe holds that ensure you never lose a reserved copy to race conditions.
          </p>
          <div className="feature-card-action">
            {isAuthenticated ? "My Reservations &rarr;" : "Sign in to Reserve &rarr;"}
          </div>
        </Link>
      </section>
    </div>
  );
}

export default Home;
