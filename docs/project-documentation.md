# Technical Project Documentation: Online Book Inventory & Reservation System

## 1. Introduction
The **Online Book Inventory & Reservation System** is a full-stack web application designed for academic departments and institutional libraries. It enables students, faculty members, and library staff to browse the catalog, perform real-time book searches, place concurrency-safe reservation holds, manage circulation (book issuance and returns), track due dates and overdue statuses, and administer the catalog through role-tailored dashboards.

---

## 2. Problem Statement
Traditional library operations frequently encounter severe bottlenecks:
- Inaccurate physical stock records caused by uncoordinated borrowing and returns.
- Race conditions during peak reservation periods where multiple patrons request the last remaining copy simultaneously.
- Manual tracking of loan due dates resulting in unmonitored overdue books and lost inventory.
- Fragmented catalog administration that lacks validation, dependency integrity safeguards, and role-based access control.

---

## 3. Objectives
- **ACID Transaction-Safe Operations**: Ensure inventory decrements and increments occur atomically during reservation, cancellation, issuance, and return.
- **Role-Based Access Control (RBAC)**: Distinguish between regular library patrons (`USER`) and library staff (`ADMIN`).
- **Real-Time Catalog Discovery**: Provide instant, debounced search across book titles, authors, categories, and ISBNs with availability filtering.
- **Automated Circulation Management**: Automate due date calculation (14-day default), overdue status detection, and reservation fulfillment.
- **Defensive Error Handling & UX**: Deliver normalized API responses, prevent credential exposure, and provide clear user feedback.

---

## 4. Proposed System
The system is implemented as a modern multi-tiered architecture:
- **Client Tier**: A responsive Single-Page Application (SPA) built with React 18, React Router v6, and Vite.
- **Application Tier**: A modular Node.js and Express.js REST API structured with dedicated routes, controllers, services, and middlewares.
- **Data Tier**: A relational MySQL 8.0 database accessed via connection pooling with strict foreign key constraints, check constraints, and indexed lookup fields.

---

## 5. Features
### Patron Features (`USER`)
- Account registration with email validation and secure password hashing.
- Live catalog search by keyword (title, author name, category, ISBN) with debounced input.
- Filtering by real-time availability (`available_copies > 0`).
- Detailed views of books with author biographical profiles.
- One-click book reservation holds on available titles.
- Self-service reservation cancellation with immediate inventory restoration.
- Personal dashboard summarizing active reservations, loan history, due dates, and return statuses.

### Administrator Features (`ADMIN`)
- Comprehensive Catalog CRUD for authors and books.
- Deletion safeguards preventing removal of authors associated with existing catalog books.
- Reservation ledger oversight with ability to approve or cancel holds.
- Circulation desk for issuing books (direct or reservation-linked) and processing returns.
- Overdue tracking dashboard identifying loans exceeding the 14-day borrowing threshold.
- System metrics overview (total books, available stock, active loans, overdue count).

---

## 6. Technology Stack
- **Frontend**: React 18.3, Vite 6.0, React Router DOM 6.28, React Hooks (`useState`, `useEffect`, `useContext`, `useCallback`, `useMemo`), Vanilla CSS3.
- **Backend**: Node.js v18+, Express.js 4.21, RESTful JSON API.
- **Database**: MySQL 8.0, `mysql2` connection pool with Promise API.
- **Security**: JSON Web Tokens (`jsonwebtoken`), `bcrypt` (10 salt rounds), CORS.
- **Testing**: Custom Node.js assertion test suites (95 backend tests + 37 frontend integration tests = 132 automated tests).
- **Version Control**: Git, GitHub flow model.

---

## 7. Architecture
The backend follows a clean layered separation of concerns:

```
[ HTTP Client (React Vite SPA) ]
              │  HTTP/JSON (Bearer JWT)
              ▼
[ Express Router Layer ]
  - auth.routes, book.routes, author.routes, reservation.routes, transaction.routes, health.routes
              │
              ▼
[ Middleware Pipeline ]
  - cors, loggerMiddleware, authMiddleware (JWT verify), roleMiddleware (RBAC)
              │
              ▼
[ Controller Layer ]
  - Extracts parameters, sanitizes input, delegates to services, formats HTTP response
              │
              ▼
[ Service Layer ]
  - Enforces business rules, executes ACID multi-statement transactions, handles edge cases
              │
              ▼
[ Database Connection Pool (mysql2) ]
  - Connection pooling (10 connections), parameterized SQL queries
              │
              ▼
[ MySQL 8.0 Relational Database ]
```

---

## 8. Database Design
The database schema (`library_db`) consists of 5 core relational tables:

1. **`users`**:
   - `id` (PK, INT, AUTO_INCREMENT)
   - `name` (VARCHAR(100))
   - `email` (VARCHAR(100), UNIQUE)
   - `password` (VARCHAR(255), bcrypt hash)
   - `role` (ENUM('USER', 'ADMIN'), default 'USER')
   - `created_at` (TIMESTAMP)

2. **`authors`**:
   - `id` (PK, INT, AUTO_INCREMENT)
   - `name` (VARCHAR(100))
   - `biography` (TEXT)
   - `created_at` (TIMESTAMP)

3. **`books`**:
   - `id` (PK, INT, AUTO_INCREMENT)
   - `title` (VARCHAR(255))
   - `isbn` (VARCHAR(20), UNIQUE)
   - `author_id` (FK -> `authors.id`, ON DELETE SET NULL)
   - `category` (VARCHAR(50))
   - `total_copies` (INT, CHECK >= 0)
   - `available_copies` (INT, CHECK >= 0, CHECK <= total_copies)
   - `description` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)

4. **`reservations`**:
   - `id` (PK, INT, AUTO_INCREMENT)
   - `user_id` (FK -> `users.id`, ON DELETE RESTRICT)
   - `book_id` (FK -> `books.id`, ON DELETE RESTRICT)
   - `reservation_date` (TIMESTAMP)
   - `status` (ENUM('PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'), default 'PENDING')

5. **`transactions`**:
   - `id` (PK, INT, AUTO_INCREMENT)
   - `user_id` (FK -> `users.id`, ON DELETE RESTRICT)
   - `book_id` (FK -> `books.id`, ON DELETE RESTRICT)
   - `reservation_id` (FK -> `reservations.id`, ON DELETE SET NULL)
   - `issue_date` (TIMESTAMP)
   - `due_date` (DATE)
   - `return_date` (DATE, NULL)
   - `status` (ENUM('ISSUED', 'RETURNED', 'OVERDUE'), default 'ISSUED')

---

## 9. Authentication and Authorization
- **Token Mechanism**: Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 using a server-side secret (`JWT_SECRET`).
- **Token Payload**: Contains `id`, `email`, and `role`.
- **Password Security**: Evaluated using `bcrypt.compare()` against 10-round salted hashes.
- **Middleware**:
  - `authMiddleware`: Extracts `Authorization: Bearer <token>`, verifies signature and expiration, and attaches `req.user`.
  - `roleMiddleware`: Guards administrative routes (`authorizeRoles('ADMIN')`), returning `403 Forbidden` if patron role is insufficient.

---

## 10. Book Management
Administrators can perform full lifecycle management of books:
- Creation requires mandatory `title`, unique `isbn`, `category`, and non-negative `total_copies`.
- Updating allows modifying book metadata and synchronizing inventory counts.
- Deletion is protected against active circulation and reservation dependencies.

---

## 11. Reservation System
The reservation engine implements concurrency-safe inventory holds:
- When a patron reserves a book (`POST /api/reservations`), a database transaction locks the row (`SELECT ... FOR UPDATE`), verifies `available_copies > 0`, decrements `available_copies` by 1, and inserts a reservation record with status `PENDING`.
- Patrons cannot place duplicate active reservations for the same title.
- Cancellation (`PUT /api/reservations/:id/cancel`) by the user or admin updates status to `CANCELLED` and atomically increments `available_copies` by 1.
- Admin approval (`PUT /api/reservations/:id/approve`) updates status to `APPROVED`.

---

## 12. Issue/Return System
Circulation tracking manages physical possession of books:
- **Book Issue (`POST /api/transactions/issue`)**:
  - Requires `user_id` and `book_id`, with optional `reservation_id`.
  - If a reservation was approved, the reservation transitions to `COMPLETED`.
  - If issued directly without reservation, `available_copies` is decremented by 1.
  - Automatically calculates `due_date` as `issue_date + 14 days`.
- **Book Return (`POST /api/transactions/:id/return`)**:
  - Sets transaction status to `RETURNED` and stamps `return_date = CURDATE()`.
  - Atomically increments `available_copies` by 1.
  - Rejects attempts to return already returned loans with `409 Conflict`.

---

## 13. Search and Filtering
- Search input uses a custom React hook `useDebounce` (300ms delay) to prevent excessive backend queries.
- Keyword queries are matched against `title`, `isbn`, author `name`, and `category` using case-insensitive SQL matching.
- Availability toggle (`available=true`) filters items where `available_copies > 0`.
- All query inputs are parameterized to eliminate SQL injection vulnerabilities.

---

## 14. User Dashboard
The Patron Dashboard provides a unified self-service portal:
- Profile card displaying user name, email, and member badge.
- Summary statistics (Active Holds, Borrowed Books, Overdue Alerts).
- Tabbed panels displaying active and historical reservations with live cancellation buttons.
- Circulation history displaying issue dates, scheduled due dates, and real-time overdue badges.

---

## 15. Admin Dashboard
The Administrative Console equips library staff with operational oversight:
- System overview metrics (Total Titles, Total Stock, Active Holds, Books on Loan, Overdue Count).
- **Books Management View**: Tabular catalog with search, edit modal, delete confirmation, and stock adjustments.
- **Authors Management View**: Author registry with bio editor and book-dependency deletion safeguards.
- **Reservations Desk**: Filterable ledger of all patron holds with Approve and Cancel controls.
- **Circulation Desk**: Issue modal (with patron/book selectors) and Return processing with one-click return buttons.

---

## 16. Error Handling & Validation
- **Centralized Middleware (`errorMiddleware.js`)**: Normalizes all application exceptions into a standardized JSON response:
  ```json
  {
    "success": false,
    "message": "Human-readable explanation",
    "errors": []
  }
  ```
- **Technical Error Translation**:
  - MySQL `1062` (Duplicate entry) translated to `409 Conflict`.
  - MySQL `1451` (Foreign key constraint violation) translated to `409 Conflict`.
  - Malformed JSON request bodies translated to `400 Bad Request`.
  - JWT signature or expiration errors translated to `401 Unauthorized`.
- **Production Sanitization**: Raw database queries and internal stack traces are suppressed in production mode.

---

## 17. Testing & Quality Assurance
The codebase includes **132 automated tests** across 6 comprehensive test suites:
- `test_auth.js` (11 tests): Registration, login, JWT issuance, profile retrieval, malformed auth headers.
- `test_authors_books.js` (15 tests): Catalog CRUD, left joins, search queries, pagination.
- `test_reservations_transactions.js` (15 tests): Transaction-safe inventory holds, cancellation, issuance, return.
- `test_error_handling_validation.js` (22 tests): Malformed JSON, XSS, boundary conditions, invalid IDs.
- `test_qa_comprehensive.js` (32 tests): Multi-user concurrency, RBAC enforcement, state machine validation.
- `test_frontend_integration.js` (37 tests): Component rendering, state synchronization, hooks, service contracts.

All 132 tests pass with 100% success rate (`npm test`).

---

## 18. Git Workflow
The project follows a structured Git branching model:
- `master`: Protected production branch.
- Feature branches (`feature/<name>`) for new capabilities.
- Bugfix branches (`fix/<name>`) for defect corrections.
- Conventional Commits standard (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- Documented pull request template and pre-commit review checklists.

---

## 19. Deployment Readiness
- Environment variables are isolated in `.env` files; `.env.example` templates provide clear documentation.
- CORS supports single or multi-domain origins via `CLIENT_URL`.
- Health check probe (`GET /api/health`) provides status and database connectivity validation for load balancers.
- Frontend builds cleanly via Vite (`npm run build`) into static assets suitable for CDN or reverse-proxy serving.
- Startup script (`npm start`) invokes production Node.js process.

---

## 20. Future Scope
While the current implementation fulfills all core departmental library requirements, potential future enhancements include:
1. **Automated Email Notifications**: Overdue notices and reservation availability alerts via SendGrid or Nodemailer.
2. **Fine & Penalty Calculation**: Automatic fine accrual for overdue loans with payment gateway integration.
3. **Barcode & QR Code Scanning**: Camera-based barcode scanner in the React frontend for instant book checkouts.
4. **Cloud Infrastructure Automation**: Docker containerization (`Dockerfile` and `docker-compose.yml`) and CI/CD pipelines (GitHub Actions).
5. **Advanced Analytics & Reports**: Exportable circulation analytics (PDF/CSV) detailing patron borrowing trends and popular genres.
