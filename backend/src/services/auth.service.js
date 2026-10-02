const bcrypt = require('bcrypt');
const db = require('../config/db');
const { generateToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registers a new user with role 'USER' and securely hashed password.
 *
 * @param {Object} userData
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.password
 * @returns {Promise<{ id: number, name: string, email: string, role: string }>}
 */
async function registerUser({ name, email, password }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('Name is required');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    throw ApiError.badRequest('Email is required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw ApiError.badRequest('Invalid email format');
  }

  if (!password || typeof password !== 'string') {
    throw ApiError.badRequest('Password is required');
  }

  if (password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long');
  }

  // Check if email already exists
  const [existing] = await db.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );

  if (existing.length > 0) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user with default role 'USER'
  const [result] = await db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name.trim(), normalizedEmail, hashedPassword, 'USER']
  );

  return {
    id: result.insertId,
    name: name.trim(),
    email: normalizedEmail,
    role: 'USER'
  };
}

/**
 * Authenticates a user with email and password, returning user data and a JWT.
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ token: string, user: { id: number, name: string, email: string, role: string } }>}
 */
async function loginUser({ email, password }) {
  if (!email || typeof email !== 'string' || !email.trim()) {
    throw ApiError.badRequest('Email is required');
  }

  if (!password || typeof password !== 'string') {
    throw ApiError.badRequest('Password is required');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find user by email
  const [rows] = await db.query(
    'SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );

  if (rows.length === 0) {
    // Return generic error message to prevent account enumeration
    throw ApiError.unauthorized('Invalid email or password');
  }

  const user = rows[0];

  // Compare passwords with bcrypt
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate signed JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

/**
 * Retrieves safe profile information for the authenticated user by ID.
 *
 * @param {number|string} userId
 * @returns {Promise<{ id: number, name: string, email: string, role: string, created_at: Date }>}
 */
async function getUserProfile(userId) {
  const [rows] = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  return rows[0];
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
