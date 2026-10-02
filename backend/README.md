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
│   │   ├── auth.controller.js        # Authentication & user profile handlers
│   │   ├── author.controller.js      # Author management handlers
│   │   ├── book.controller.js        # Book search & management handlers
│   │   ├── health.controller.js      # Health check handler
│   │   ├── reservation.controller.js # Reservation lifecycle handlers
│   │   └── transaction.controller.js # Circulation & loan transaction handlers
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT Bearer token authentication
│   │   ├── errorMiddleware.js        # Centralized error handler (400, 401, 403, 404, 409, 500)
│   │   ├── loggerMiddleware.js       # Request logging middleware
│   │   ├── notFoundMiddleware.js     # 404 Not Found route handler
│   │   ├── roleMiddleware.js         # Role-based authorization (USER, ADMIN)
│   │   └── validateMiddleware.js     # Foundation for request validation
│   ├── routes/
│   │   ├── index.js                  # Central API router aggregator (/api)
│   │   ├── auth.routes.js            # Authentication endpoints (register, login, logout, me)
│   │   ├── author.routes.js          # Author CRUD endpoints
│   │   ├── book.routes.js            # Book CRUD & search endpoints
│   │   ├── health.routes.js          # Health & database connectivity check
│   │   ├── reservation.routes.js     # Reservation endpoints (create, cancel, approve, history)
│   │   └── transaction.routes.js     # Circulation endpoints (issue, return, overdue, history)
│   ├── services/
│   │   ├── auth.service.js           # Auth business logic, bcrypt hashing & JWT generation
│   │   ├── author.service.js         # Author business logic & queries
│   │   ├── book.service.js           # Book business logic & SQL queries
│   │   ├── health.service.js         # Health check & database pool verification
│   │   ├── reservation.service.js    # Concurrency-safe reservations & row-locking (SELECT FOR UPDATE)
│   │   └── transaction.service.js    # Transaction-safe issue/return & loan circulation logic
│   ├── utils/
│   │   ├── ApiError.js               # Custom operational error class
│   │   ├── ApiResponse.js            # Standardized API response formatter
│   │   ├── asyncHandler.js           # Async wrapper catching unhandled promise rejections
│   │   └── jwt.js                    # JWT sign and verify helper functions
│   ├── app.js                        # Express app configuration & middlewares
│   └── server.js                     # HTTP listener & database connection check
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
| `POST` | `/api/reservations` | Authenticated | Reserve a book (transactional hold with `SELECT ... FOR UPDATE`, decrements `available_copies`) |
| `GET` | `/api/reservations` | Authenticated | Get current user's reservations |
| `GET` | `/api/reservations/all` | Admin Only | Get all system reservations with user and book details |
| `GET` | `/api/reservations/:id` | Authenticated | Get specific reservation by ID (user or admin) |
| `PUT` | `/api/reservations/:id/cancel` | Authenticated | Cancel reservation (restores held copy to inventory) |
| `PUT` | `/api/reservations/:id/approve` | Admin Only | Admin approve reservation (`PENDING` -> `APPROVED`) |
| `POST` | `/api/transactions/issue` | Admin Only | Issue book (direct checkout or fulfilling reservation, calculates due date) |
| `POST` | `/api/transactions/:id/return` | Admin Only | Return issued book (records return date, increments inventory, updates overdue) |
| `GET` | `/api/transactions` | Authenticated | Get current user's borrowing history |
| `GET` | `/api/transactions/all` | Admin Only | Get all borrowing transactions |
| `GET` | `/api/transactions/overdue` | Admin Only | Get all overdue loans |

## Concurrency & Inventory Safety Rules

1. **Reservation Hold**: Placing a reservation (`POST /api/reservations`) initiates a database transaction and acquires an exclusive row lock (`SELECT ... FOR UPDATE`) on the book. If `available_copies > 0`, it decrements `available_copies` by 1 and records the reservation with `PENDING` status. If no copies are available, the transaction rolls back with a `400 Bad Request`.
2. **Issue with Reservation**: When issuing a book associated with an active reservation, the system completes the reservation (`COMPLETED`) and creates an `ISSUED` transaction. Because the reservation already decremented the inventory upon hold, the book inventory is NOT decremented again, preventing duplicate deductions.
3. **Direct Checkout**: When an admin directly issues a book without prior reservation, the system locks the book row and decrements `available_copies` inside the transaction.
4. **Cancellation & Return**: Cancelling a reservation or returning an issued book increments `available_copies` inside a transaction up to `total_copies`. Invariant constraints `0 <= available_copies <= total_copies` are strictly enforced.

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
