const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const bookRoutes = require('./book.routes');
const authorRoutes = require('./author.routes');
const reservationRoutes = require('./reservation.routes');
const transactionRoutes = require('./transaction.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/authors', authorRoutes);
router.use('/reservations', reservationRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;
