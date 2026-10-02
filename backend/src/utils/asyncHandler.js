/**
 * Wrapper utility for asynchronous Express route handlers and middleware.
 * Automatically catches rejected promises and passes them to next(err).
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
