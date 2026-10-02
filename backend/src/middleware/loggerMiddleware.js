/**
 * Development request logger middleware.
 * Logs HTTP method, path, response status, and execution duration.
 */
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = loggerMiddleware;
