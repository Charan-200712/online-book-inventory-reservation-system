const express = require('express');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/health.routes');
const bookRoutes = require('./routes/book.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/books', bookRoutes);

// Root fallback endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Online Book Inventory & Reservation System API',
    healthCheck: '/api/health',
    sampleLeftJoin: '/api/books/sample-left-join'
  });
});

module.exports = app;
