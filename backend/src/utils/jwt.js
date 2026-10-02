const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for the authenticated user.
 *
 * @param {Object} payload - User identification and role data
 * @param {number|string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role ('USER' or 'ADMIN')
 * @returns {string} Signed JWT token
 */
function generateToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies and decodes a JWT token.
 *
 * @param {string} token - The raw JWT token string
 * @returns {Object} Decoded payload
 */
function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.verify(token, secret);
}

module.exports = {
  generateToken,
  verifyToken
};
