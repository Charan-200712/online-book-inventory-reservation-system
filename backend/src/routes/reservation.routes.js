const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// User reservation creation & history
router.post('/', authenticate, reservationController.createReservation);
router.get('/', authenticate, reservationController.getUserReservations);

// Admin-only list of all reservations (must precede /:id)
router.get('/all', authenticate, authorizeRoles('ADMIN'), reservationController.getAllReservations);

// Single reservation detail (owner or admin)
router.get('/:id', authenticate, reservationController.getReservationById);

// Status modification endpoints
router.put('/:id/approve', authenticate, authorizeRoles('ADMIN'), reservationController.approveReservation);
router.put('/:id/cancel', authenticate, reservationController.cancelReservation);

module.exports = router;
