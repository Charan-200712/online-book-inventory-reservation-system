const ApiError = require('../utils/ApiError');

/**
 * Role-based authorization middleware factory.
 * Restricts access to users possessing one of the allowed roles.
 *
 * @param {...string} allowedRoles - Allowed roles (e.g. 'ADMIN', 'USER')
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access denied: role '${req.user.role}' is not authorized for this resource`));
    }

    next();
  };
};

module.exports = authorizeRoles;
