/**
 * Centralized Express error-handling middleware.
 * Formats errors into consistent JSON responses and prevents unhandled crashes.
 */
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  // Log server error details for debugging (suppress noisy 404s in console)
  if (statusCode >= 500) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`, err);
  }

  const response = {
    success: false,
    message
  };

  // Include validation details if provided
  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
