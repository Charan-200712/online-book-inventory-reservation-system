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
│   │   ├── db.js                 # MySQL2 connection pool & test helper
│   │   └── seed.js               # Database seed script
│   ├── controllers/
│   │   ├── auth.controller.js        # Authentication & user profile handlers
│   │   ├── author.controller.js      # Author management handlers (with ID validation)
│   │   ├── book.controller.js        # Book search & management handlers (with ID validation)
│   │   ├── health.controller.js      # Health check handler
│   │   ├── reservation.controller.js # Reservation lifecycle handlers (with ID validation)
│   │   └── transaction.controller.js # Circulation & loan transaction handlers (with ID validation)
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT Bearer token authentication
│   │   ├── errorMiddleware.js        # Centralized error handler & MySQL error translator
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
├── tests/
│   ├── test_auth.js                          # Phase 4 Auth test suite
│   ├── test_authors_books.js                 # Phase 5 Catalog test suite
│   ├── test_reservations_transactions.js     # Phase 6 Concurrency & transactions suite
│   └── test_error_handling_validation.js     # Phase 11 Error handling & validation suite
├── .env.example
├── package.json
└── README.md
```

## Standardized API Error Format

All error responses across the backend conform to a standardized JSON schema:

```json
{
  "success": false,
  "message": "Human readable error description"
}
```

### HTTP Status Code Conventions
- `200 OK`: Successful retrieval or update.
- `201 Created`: Successful creation of a new resource (book, author, reservation, loan).
- `400 Bad Request`: Validation failure, invalid IDs (non-numeric, negative), malformed JSON.
- `401 Unauthorized`: Missing, invalid, or expired JWT.
- `403 Forbidden`: Authenticated user lacking required privileges (e.g. `USER` on admin endpoints).
- `404 Not Found`: Resource or route not found.
- `409 Conflict`: Business logic violation (duplicate email, duplicate ISBN, referential constraint, already approved/cancelled hold).
- `500 Internal Server Error`: Unexpected system fault or database connection outage.

### Error Translation & Sanitization
The centralized error middleware (`errorMiddleware.js`) intercepts and sanitizes errors before sending responses:
1. **MySQL Duplicate Entry (1062 / `ER_DUP_ENTRY`)**: Automatically mapped to `409 Conflict` with human-readable messaging for emails or ISBNs.
2. **Foreign Key Reference Constraint (1451 / `ER_ROW_IS_REFERENCED_2`)**: Mapped to `409 Conflict` protecting referential integrity.
3. **Foreign Key Missing Constraint (1452 / `ER_NO_REFERENCED_ROW_2`)**: Mapped to `400 Bad Request`.
4. **Database Connection Loss**: Mapped to `500` with `"Database service is currently unavailable. Please try again later."`
5. **Malformed JSON Syntax**: Mapped to `400 Bad Request` with `"Malformed JSON syntax in request body"`.
6. **Zero Leakage**: Internal SQL statements, credentials, stack traces, and database table names are never leaked to the client.

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
| `GET` | `/api/transactions/overdue` | Admin Only | Get all overdue transactions |

## Running the Automated Test Suite

```bash
cd backend
npm test
```
Executes all 4 suites:
1. `test_auth.js` (Phase 4 Authentication & Role Verification)
2. `test_authors_books.js` (Phase 5 Books, Authors, & Availability Filter)
3. `test_reservations_transactions.js` (Phase 6 Concurrency, Transactions & Row-Locks)
4. `test_error_handling_validation.js` (Phase 11 Error Translation, ID Validation, & Sanitization)
