const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware that verifies Bearer JWT tokens.
 * Attaches decoded user payload ({ userId, email, role }) to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(ApiError.unauthorized('Authorization header is missing'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(ApiError.unauthorized('Invalid authorization header format. Expected Bearer <token>'));
  }

  const token = parts[1];
  if (!token) {
    return next(ApiError.unauthorized('Token is missing'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired'));
    }
    return next(ApiError.unauthorized('Invalid or corrupted token'));
  }
};

module.exports = authenticate;
