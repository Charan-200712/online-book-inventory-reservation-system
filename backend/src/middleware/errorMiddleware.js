/**
 * Centralized Express error-handling middleware.
 * Translates technical database and parsing errors into clean, standardized,
 * and user-friendly JSON responses without exposing internal SQL, credentials,
 * or stack traces.
 */
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // 1. MySQL Duplicate Key Error (ER_DUP_ENTRY / 1062)
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    statusCode = 409;
    const sqlMsg = (err.sqlMessage || '').toLowerCase();
    if (sqlMsg.includes('users.email') || sqlMsg.includes('email')) {
      message = 'An account with this email already exists';
    } else if (sqlMsg.includes('books.isbn') || sqlMsg.includes('isbn')) {
      message = 'A book with this ISBN already exists';
    } else {
      message = 'Duplicate entry conflict detected';
    }
  }

  // 2. MySQL Foreign Key Constraints (1451: parent row referenced, 1452: invalid child foreign key)
  else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    statusCode = 409;
    message = 'Cannot modify or delete record because related records depend on it';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    statusCode = 400;
    message = 'Referenced related record does not exist';
  }

  // 3. MySQL Connection / Service Down Errors
  else if (
    ['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'PROTOCOL_CONNECTION_LOST', 'ENOTFOUND'].includes(
      err.code
    )
  ) {
    statusCode = 500;
    message = 'Database service is currently unavailable. Please try again later.';
  }

  // 4. Express Body Parser Malformed JSON
  else if (
    err.type === 'entity.parse.failed' ||
    (err instanceof SyntaxError && err.status === 400 && 'body' in err)
  ) {
    statusCode = 400;
    message = 'Malformed JSON syntax in request body';
  }

  // 5. JWT Errors if unhandled upstream
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or corrupted authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // 6. Sanitize 500 Internal Errors (never leak SQL queries, schema, or system traces)
  if (statusCode >= 500 && !err.isOperational) {
    if (err.sql || err.sqlMessage || !err.message) {
      message = 'An unexpected internal server error occurred';
    }
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`, err);
  }

  const response = {
    success: false,
    message
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
