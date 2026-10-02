import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMsg('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">📝</span>
          <h2>Create Account</h2>
          <p>Register as a student or library member</p>
        </div>

        {successMsg && (
          <div className="success-banner" role="status">
            <span>✅ {successMsg}</span>
          </div>
        )}

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="name"
              required
            />
            {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email Address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="e.g. jane.doe@library.edu"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
            {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password (min 6 characters)</label>
            <input
              id="register-password"
              name="password"
              type="password"
              className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
            {fieldErrors.password && <span className="field-error-msg">{fieldErrors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="register-confirmPassword">Confirm Password</label>
            <input
              id="register-confirmPassword"
              name="confirmPassword"
              type="password"
              className={`form-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error-msg">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
