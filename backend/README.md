# Backend — Online Book Inventory & Reservation System

Express.js REST API service for library inventory and reservation management.

## Architecture

The backend follows a layered MVC / Service architecture:

```text
HTTP Request
     ↓
Route Layer (backend/src/routes/)
     ↓
Controller Layer (backend/src/controllers/)
     ↓
Service Layer (backend/src/services/)
     ↓
Database Layer (MySQL Pool via backend/src/config/db.js)
```

## Directory Structure
```text
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MySQL2 connection pool & test helper
│   ├── controllers/
│   │   ├── book.controller.js    # Book request handlers
│   │   └── health.controller.js  # Health check handler
│   ├── middleware/
│   │   ├── errorMiddleware.js    # Centralized error handler (400, 401, 403, 404, 500)
│   │   ├── loggerMiddleware.js   # Request logging middleware
│   │   ├── notFoundMiddleware.js # 404 Not Found route handler
│   │   └── validateMiddleware.js # Foundation for request validation
│   ├── routes/
│   │   ├── index.js              # Central API router aggregator (/api)
│   │   ├── auth.routes.js        # Authentication endpoints placeholder
│   │   ├── author.routes.js      # Author endpoints placeholder
│   │   ├── book.routes.js        # Book endpoints & LEFT JOIN demo
│   │   ├── health.routes.js      # Health & database connectivity check
│   │   ├── reservation.routes.js # Reservation endpoints placeholder
│   │   └── transaction.routes.js # Circulation transaction endpoints placeholder
│   ├── services/
│   │   ├── book.service.js       # Book business logic & SQL queries
│   │   └── health.service.js     # Health check & database pool verification
│   ├── utils/
│   │   ├── ApiError.js           # Custom operational error class
│   │   ├── ApiResponse.js        # Standardized API response formatter
│   │   └── asyncHandler.js       # Async wrapper catching unhandled promise rejections
│   ├── app.js                    # Express app configuration & middlewares
│   └── server.js                 # HTTP listener & database connection check
├── .env.example
├── package.json
└── README.md
```

## Available Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API Information and directory of endpoints |
| `GET` | `/api/health` | Service health status and database connectivity |
| `GET` | `/api/books/sample-left-join` | Demonstrates relational LEFT JOIN query |
| `ALL` | `/api/auth/*` | Auth routes placeholder (Phase 4) |
| `ALL` | `/api/books/*` | Book routes placeholder (Phase 5) |
| `ALL` | `/api/authors/*` | Author routes placeholder (Phase 6) |
| `ALL` | `/api/reservations/*` | Reservation routes placeholder (Phase 7) |
| `ALL` | `/api/transactions/*` | Transaction routes placeholder (Phase 8) |

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Copy `.env.example` to `.env` and configure variables:
   ```bash
   cp .env.example .env
   ```

3. Start server:
   - Development (with auto-reload):
     ```bash
     npm run dev
     ```
   - Production:
     ```bash
     npm start
     ```
