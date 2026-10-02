const reservationService = require('../services/reservation.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Controller: Create reservation for authenticated user
 * POST /api/reservations
 */
const createReservation = asyncHandler(async (req, res) => {
  const rawBookId = req.body.book_id || req.body.bookId;
  const bookId = parseInt(rawBookId, 10);
  if (isNaN(bookId) || bookId <= 0) {
    throw ApiError.badRequest('Valid book_id is required and must be a positive integer.');
  }

  const reservation = await reservationService.createReservation({
    userId: req.user.userId,
    bookId
  });

  return res.status(201).json({
    success: true,
    message: 'Reservation created successfully',
    reservation
  });
});

/**
 * Controller: Get reservations belonging to authenticated user
 * GET /api/reservations
 */
const getUserReservations = asyncHandler(async (req, res) => {
  const reservations = await reservationService.getUserReservations(req.user.userId);

  return res.status(200).json({
    success: true,
    count: reservations.length,
    reservations
  });
});

/**
 * Controller: Get all reservations (Admin only)
 * GET /api/reservations/all
 */
const getAllReservations = asyncHandler(async (req, res) => {
  const reservations = await reservationService.getAllReservations();

  return res.status(200).json({
    success: true,
    count: reservations.length,
    reservations
  });
});

/**
 * Controller: Get single reservation by ID
 * GET /api/reservations/:id
 */
const getReservationById = asyncHandler(async (req, res) => {
  const reservationId = parseInt(req.params.id, 10);
  if (isNaN(reservationId) || reservationId <= 0) {
    throw ApiError.badRequest('Invalid reservation ID. Must be a positive integer.');
  }

  const reservation = await reservationService.getReservationById(reservationId, req.user);

  return res.status(200).json({
    success: true,
    reservation
  });
});

/**
 * Controller: Approve reservation (Admin only)
 * PUT /api/reservations/:id/approve
 */
const approveReservation = asyncHandler(async (req, res) => {
  const reservationId = parseInt(req.params.id, 10);
  if (isNaN(reservationId) || reservationId <= 0) {
    throw ApiError.badRequest('Invalid reservation ID. Must be a positive integer.');
  }

  const reservation = await reservationService.approveReservation(reservationId);

  return res.status(200).json({
    success: true,
    message: 'Reservation approved successfully',
    reservation
  });
});

/**
 * Controller: Cancel reservation (Owner or Admin)
 * PUT /api/reservations/:id/cancel
 */
const cancelReservation = asyncHandler(async (req, res) => {
  const reservationId = parseInt(req.params.id, 10);
  if (isNaN(reservationId) || reservationId <= 0) {
    throw ApiError.badRequest('Invalid reservation ID. Must be a positive integer.');
  }

  const result = await reservationService.cancelReservation(reservationId, req.user);

  return res.status(200).json({
    success: true,
    message: result.message,
    reservation: result
  });
});

module.exports = {
  createReservation,
  getUserReservations,
  getAllReservations,
  getReservationById,
  approveReservation,
  cancelReservation
};
