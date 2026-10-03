const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Controller: Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const newUser = await authService.registerUser(req.body);

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: newUser
  });
});

/**
 * Controller: Authenticate user & issue JWT
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token: result.token,
    user: result.user
  });
});

/**
 * Controller: Stateless logout
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 'Logout successful');
});

/**
 * Controller: Get currently authenticated user profile
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.userId);

  return res.status(200).json({
    success: true,
    user
  });
});

/**
 * Controller: Protected route for admin role verification testing
 * GET /api/auth/admin-test
 */
const adminTest = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 'Admin authorization verified successfully', {
    user: req.user
  });
});

/**
 * Controller: Get all registered users (Admin only)
 * GET /api/auth/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await authService.getAllUsers();
  return res.status(200).json({
    success: true,
    count: users.length,
    users
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  adminTest,
  getAllUsers
};
