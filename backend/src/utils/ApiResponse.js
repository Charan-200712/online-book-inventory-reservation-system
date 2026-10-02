/**
 * Standardized API response helper for consistent JSON responses.
 */
class ApiResponse {
  /**
   * Send a successful JSON response.
   *
   * @param {Object} res - Express response object
   * @param {string} message - Human-readable success message
   * @param {*} [data=null] - Payload data
   * @param {number} [statusCode=200] - HTTP status code
   */
  static success(res, message = 'Success', data = null, statusCode = 200) {
    const responsePayload = {
      success: true,
      message
    };

    if (data !== null && data !== undefined) {
      responsePayload.data = data;
    }

    return res.status(statusCode).json(responsePayload);
  }

  /**
   * Send an error JSON response.
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {*} [errors=null] - Additional error details/validation errors
   */
  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const responsePayload = {
      success: false,
      message
    };

    if (errors !== null && errors !== undefined) {
      responsePayload.errors = errors;
    }

    return res.status(statusCode).json(responsePayload);
  }
}

module.exports = ApiResponse;
