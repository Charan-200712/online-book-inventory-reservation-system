const ApiError = require('../utils/ApiError');

/**
 * Middleware to handle unmatched routes and pass a 404 ApiError.
 */
const notFoundMiddleware = (req, res, next) => {
  const error = ApiError.notFound(`Resource not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

module.exports = notFoundMiddleware;
