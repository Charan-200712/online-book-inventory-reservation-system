const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/index');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// 1. CORS Configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Request Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request Logging Middleware (Development-friendly)
if (process.env.NODE_ENV !== 'test') {
  app.use(loggerMiddleware);
}

// 4. Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Online Book Inventory & Reservation System API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      books: '/api/books',
      authors: '/api/authors',
      reservations: '/api/reservations',
      transactions: '/api/transactions'
    }
  });
});

// 5. Mount Central API Routes
app.use('/api', apiRoutes);

// 6. 404 Not Found Middleware (catches unmatched routes)
app.use(notFoundMiddleware);

// 7. Centralized Error-Handling Middleware
app.use(errorMiddleware);

module.exports = app;
