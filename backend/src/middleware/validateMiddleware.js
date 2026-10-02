const ApiError = require('../utils/ApiError');

/**
 * Validation middleware factory.
 * Establishes a clean foundation for request validation (body, query, params).
 *
 * @param {Function} validatorFn - Function receiving req that returns { valid: boolean, errors?: Array|string }
 * @returns {Function} Express middleware
 */
const validate = (validatorFn) => {
  return (req, res, next) => {
    if (typeof validatorFn !== 'function') {
      return next();
    }

    const result = validatorFn(req);
    if (!result || result.valid !== false) {
      return next();
    }

    const message = result.message || 'Validation failed';
    const error = ApiError.badRequest(message);
    if (result.errors) {
      error.errors = result.errors;
    }

    return next(error);
  };
};

module.exports = {
  validate
};
