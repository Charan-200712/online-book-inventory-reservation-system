# Comprehensive Testing & Quality Assurance Documentation

This document describes the testing strategy, test suite architecture, automated test coverage, regression verification, and QA results for the **Online Book Inventory & Reservation System**.

---

## 1. Testing Strategy Overview

The testing strategy provides multi-tiered verification across the complete software stack without introducing heavy or unnecessary dependencies:

```text
┌────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                         │
├────────────────────────────────────────────────────────────┤
│  Frontend Integration & E2E API (37 Tests)                 │
│  ├── Live Search, Debounce & AbortController Cancellation  │
│  ├── Role-Based Route Guards & Protected Redirection       │
│  ├── User Dashboard, Hold Reservations & Self-Cancellation │
│  └── Admin Catalog Management (CRUD) & Circulation Audits  │
├────────────────────────────────────────────────────────────┤
│  Backend Comprehensive QA & Concurrency (95 Tests)         │
│  ├── Authentication, bcrypt Hashing & JWT Authorization    │
│  ├── Relational Schema, Foreign Keys & LEFT JOIN Integrity │
│  ├── Transaction-Safe Inventory & Row-Level Locks          │
│  ├── State Machines (Holds & Loans) & Lifecycle Transitions│
│  └── Error Translation, Input Sanitization & 0-Leakage     │
├────────────────────────────────────────────────────────────┤
│  Build & Static Verification                               │
│  └── Vite Production Bundle & Zero-Warning Compilation    │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Test Suites Summary

| Suite | File Location | Tests | Target Layer | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Auth & Security** | `backend/tests/test_auth.js` | 18 | bcrypt hashing, JWT verification, role middleware (`USER`/`ADMIN`) | **PASSED** (100%) |
| **Catalog & Relational** | `backend/tests/test_authors_books.js` | 28 | Book/Author CRUD, LEFT JOIN queries, pagination, availability filter | **PASSED** (100%) |
| **Holds & Concurrency** | `backend/tests/test_reservations_transactions.js` | 17 | `SELECT ... FOR UPDATE`, race condition safety, issue/return transactions | **PASSED** (100%) |
| **Error Handling & Validation** | `backend/tests/test_error_handling_validation.js` | 14 | Malformed JSON, 400 ID validation, 409 conflicts, error sanitization | **PASSED** (100%) |
| **Comprehensive QA & Edge Cases** | `backend/tests/test_qa_comprehensive.js` | 18 | Case-insensitivity, whitespace trimming, SQL injection immunity, data privacy | **PASSED** (100%) |
| **Frontend Integration Suite** | `frontend/tests/test_frontend_integration.js` | 37 | End-to-end API integration, debounce, React state sync, dashboard UX | **PASSED** (100%) |
| **Total Automated Tests** | **All 6 Suites** | **132** | **Full System Stack** | **100% PASS** |

---

## 3. Detailed Test Coverage by Domain

### 3.1 Authentication & JWT Authorization
- **Registration**:
  - Valid registration creates `USER` account with bcrypt hash (salt rounds = 10).
  - Passwords and password hashes are never returned in API payloads.
  - Rejection with `400 Bad Request` for missing names, invalid email formats, and passwords shorter than 6 characters.
  - Rejection with `409 Conflict` for duplicate emails.
- **Login**:
  - Valid login generates signed JWT and safe user profile.
  - Rejection with `400 Bad Request` for missing email or password.
  - Generic `401 Unauthorized` for incorrect password or non-existent email (prevents account enumeration).
- **Session & Bearer Verification**:
  - Valid tokens allow access to `/api/auth/me`.
  - Missing, invalid, or expired tokens receive `401 Unauthorized`.
  - Mid-flight `401` triggers `auth:unauthorized` custom event to clear local storage and redirect without loops.

### 3.2 Role-Based Access Control (USER vs. ADMIN)
- Verified that authenticated `USER` role tokens are rejected with `403 Forbidden` when attempting:
  - `POST /api/books` (Add Book)
  - `PUT /api/books/:id` (Update Book)
  - `DELETE /api/books/:id` (Delete Book)
  - `POST /api/authors` (Add Author)
  - `PUT /api/authors/:id` (Update Author)
  - `DELETE /api/authors/:id` (Delete Author)
  - `GET /api/reservations/all` (View All Patron Holds)
  - `PUT /api/reservations/:id/approve` (Approve Hold)
  - `GET /api/transactions/all` (Circulation Ledger)
  - `POST /api/transactions/issue` (Issue Loan)
  - `POST /api/transactions/:id/return` (Return Book)
- Verified that `ADMIN` role tokens successfully perform all management actions.

### 3.3 Books & Authors Relational Schema Integrity
- **Relational LEFT JOIN**:
  - Verified that all books with assigned authors have `author_name` correctly populated.
  - Verified that unassigned books (`author_id = null`, e.g. Departmental Guides) are preserved in queries with `author_name = null`.
- **Referential Integrity Constraints (HTTP 409 Conflict)**:
  - Deleting an author who is associated with catalog books is blocked (`409 Conflict`).
  - Deleting a book with active reservations or loan transactions is blocked (`409 Conflict`).
- **Pagination & Filters**:
  - `GET /api/books?page=1&limit=5` returns correct pagination metadata (`total`, `totalPages`, `page`).
  - `GET /api/books?available=true` returns only books with `available_copies > 0`.
  - `GET /api/books?available=false` returns only books with `available_copies = 0`.

### 3.4 Live Search, Debounce & Security
- **Multi-Field Search**: Searches across Title, ISBN, Author Name, and Category.
- **Case & Whitespace Tolerance**:
  - Upper case (`"CLEAN"`), lower case (`"clean"`), and mixed case (`"cLeAn CoDe"`) return identical result sets.
  - Whitespace-padded inputs (`"   clean   "`) are safely trimmed.
- **SQL Injection Immunity**:
  - Malicious inputs such as `' OR 1=1; --` are safely parameterized and return zero matches without errors or SQL execution.
- **Cancellation**: In-flight superseded queries are cleanly aborted via `AbortController`.

### 3.5 Reservation State Machine & Concurrency Safety
- **State Machine Transitions**:
  - `PENDING` $\to$ `APPROVED` (via Admin approval).
  - `APPROVED` $\to$ `COMPLETED` (automatically upon loan issuance).
  - `PENDING` $\to$ `CANCELLED` (via member self-cancellation or admin).
  - Invalid transitions are strictly rejected with `409 Conflict`:
    - Re-approving an already `APPROVED` hold $\to$ `409 Conflict`.
    - Cancelling an already `CANCELLED` hold $\to$ `409 Conflict`.
    - Cancelling a `COMPLETED` hold $\to$ `409 Conflict`.
- **Concurrency & Last-Copy Protection**:
  - Tested simultaneous competing hold requests for a single remaining copy (`available_copies = 1`).
  - Using MySQL `SELECT ... FOR UPDATE` row-level locks, exactly 1 request succeeded (`201 Created`) and the second was safely rejected (`409 Conflict`).
  - Final `available_copies` remained strictly non-negative (`0`).

### 3.6 Circulation & Overdue Loans
- **Due Date Calculation**:
  - Due date is automatically computed as `issue_date + BOOK_LOAN_DAYS` (14 days).
- **Return & Restitution**:
  - Returning a book records `return_date = CURDATE()` and increments `available_copies` by 1 atomically.
  - Attempting double return on the same transaction is rejected with `409 Conflict`.
- **Cross-User Privacy**:
  - Verified that User B attempting to view User A's private reservation by ID receives `403 Forbidden`.

### 3.7 Error Handling, Sanitization & Network Translation
- Verified that all error responses conform to `{ success: false, message: ... }`.
- Verified zero leakage of SQL strings, table names, database credentials, or stack traces.
- Verified that frontend network disconnections translate into user-friendly prompts:
  `"Unable to connect to the server. Please check that the backend is running and try again."`
  instead of `TypeError: Failed to fetch`.

---

## 4. How to Execute Tests

### 4.1 Backend Test Execution
```bash
cd backend
npm test
```
Runs all 5 backend suites in sequence:
1. `node tests/test_auth.js`
2. `node tests/test_authors_books.js`
3. `node tests/test_reservations_transactions.js`
4. `node tests/test_error_handling_validation.js`
5. `node tests/test_qa_comprehensive.js`

### 4.2 Frontend Integration Test Execution
```bash
cd frontend
npm test
```
Runs the 37-step automated browser-service integration suite against an ephemeral test server.

### 4.3 Production Build Verification
```bash
cd frontend
npm run build
```
Compiles and verifies the production bundle using Vite.

---

## 5. Build Verification Results

```text
> vite build
✓ 55 modules transformed.
dist/index.html                   0.43 kB │ gzip:  0.29 kB
dist/assets/index-C_GgEGk8.css   21.61 kB │ gzip:  4.41 kB
dist/assets/index-D5iZuaCa.js   225.52 kB │ gzip: 66.92 kB
✓ built in 7.29s (0 errors, 0 warnings)
```

---

## 6. Known Limitations

- Real-time inventory push updates currently rely on page/tab refresh rather than WebSockets.
- Token refresh rotation (refresh tokens) is not implemented; JWT tokens expire after 24 hours requiring re-authentication.
- Automated email notification upon hold approval is out of scope for the current local architecture.
