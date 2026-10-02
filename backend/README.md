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
│   │   ├── auth.controller.js    # Authentication & user profile handlers
│   │   ├── book.controller.js    # Book request handlers
│   │   └── health.controller.js  # Health check handler
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer token authentication
│   │   ├── errorMiddleware.js    # Centralized error handler (400, 401, 403, 404, 409, 500)
│   │   ├── loggerMiddleware.js   # Request logging middleware
│   │   ├── notFoundMiddleware.js # 404 Not Found route handler
│   │   ├── roleMiddleware.js     # Role-based authorization (USER, ADMIN)
│   │   └── validateMiddleware.js # Foundation for request validation
│   ├── routes/
│   │   ├── index.js              # Central API router aggregator (/api)
│   │   ├── auth.routes.js        # Authentication endpoints (register, login, logout, me)
│   │   ├── author.routes.js      # Author endpoints placeholder
│   │   ├── book.routes.js        # Book endpoints & LEFT JOIN demo
│   │   ├── health.routes.js      # Health & database connectivity check
│   │   ├── reservation.routes.js # Reservation endpoints placeholder
│   │   └── transaction.routes.js # Circulation transaction endpoints placeholder
│   ├── services/
│   │   ├── auth.service.js       # Auth business logic, bcrypt hashing & JWT generation
│   │   ├── book.service.js       # Book business logic & SQL queries
│   │   └── health.service.js     # Health check & database pool verification
│   ├── utils/
│   │   ├── ApiError.js           # Custom operational error class
│   │   ├── ApiResponse.js        # Standardized API response formatter
│   │   ├── asyncHandler.js       # Async wrapper catching unhandled promise rejections
│   │   └── jwt.js                # JWT sign and verify helper functions
│   ├── app.js                    # Express app configuration & middlewares
│   └── server.js                 # HTTP listener & database connection check
├── .env.example
├── package.json
└── README.md
```

## Available Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | API Information and directory of endpoints |
| `GET` | `/api/health` | Public | Service health status and database connectivity |
| `POST` | `/api/auth/register` | Public | Register new user with hashed password (default role `USER`) |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and receive JWT |
| `POST` | `/api/auth/logout` | Public | Stateless logout response for client-side token discard |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |
| `GET` | `/api/auth/admin-test` | Admin Only | Protected test endpoint verifying `ADMIN` role authorization |
| `GET` | `/api/authors` | Authenticated | Get all authors sorted alphabetically |
| `GET` | `/api/authors/:id` | Authenticated | Get author by ID with their associated books |
| `POST` | `/api/authors` | Admin Only | Create a new author |
| `PUT` | `/api/authors/:id` | Admin Only | Update an author's name and/or biography |
| `DELETE` | `/api/authors/:id` | Admin Only | Delete author (rejected if books reference author) |
| `GET` | `/api/books` | Authenticated | Get all books with author names (LEFT JOIN), pagination, and availability filter |
| `GET` | `/api/books/search?q=...` | Authenticated | Live search across title, ISBN, author name, and category |
| `GET` | `/api/books/:id` | Authenticated | Get book by ID with detailed author and availability data |
| `POST` | `/api/books` | Admin Only | Create a new book (validates author exists and ISBN uniqueness) |
| `PUT` | `/api/books/:id` | Admin Only | Update book metadata and adjust inventory safely |
| `DELETE` | `/api/books/:id` | Admin Only | Delete book (rejected if referenced in history/reservations) |
| `GET` | `/api/books/sample-left-join` | Public | Phase 2/3/4 backwards-compatible LEFT JOIN demo |
| `ALL` | `/api/reservations/*` | - | Reservation routes placeholder (Phase 6) |
| `ALL` | `/api/transactions/*` | - | Transaction routes placeholder (Phase 7) |

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
