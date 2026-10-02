# Online Book Inventory & Reservation System

## Problem Statement
A departmental library requires a web application to manage book stocks, search book availability, reserve books, and track issue and return dates.

## Technology Stack

### Frontend
* React
* JavaScript
* Vite
* React Hooks
* React Router
* CSS

### Backend
* Node.js
* Express.js
* REST API architecture

### Database
* MySQL
* mysql2

### Version Control & Tooling
* Git / GitHub
* VS Code

## Current Phase
Phase 11 — Error Handling, Validation & UX Hardening (Complete)

## Implemented & Planned Features
* [x] Project architecture & Express setup (Phase 1)
* [x] MySQL relational schema & seed data (Phase 2)
* [x] Express backend foundation & connection pool (Phase 3)
* [x] User authentication & JWT authorization (Phase 4)
* [x] Book & author management APIs with live search & inventory rules (Phase 5)
* [x] Book reservations & concurrency-safe inventory holds (Phase 6)
* [x] Circulation transactions (issue, return, due dates, overdue detection) (Phase 6)
* [x] React frontend foundation, routing, JWT auth context & API integration (Phase 7)
* [x] Live book search, controlled forms & useEffect synchronization (Phase 8)
* [x] User dashboard, book reservations, self-cancellation & circulation history (Phase 9)
* [x] Administrator dashboard & catalog/circulation management UI (Phase 10)
* [x] Error handling, validation, sanitization & UX hardening (Phase 11)

## Project Structure
```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── test_auth.js
│   │   ├── test_authors_books.js
│   │   ├── test_reservations_transactions.js
│   │   └── test_error_handling_validation.js
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tests/
│   │   └── test_frontend_integration.js
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── README.md
├── docs/
│   └── README.md
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* npm
* MySQL 8.0+

### Running Backend
```bash
cd backend
npm install
npm run dev
# or npm start
```
Default URL: `http://localhost:5000`

### Running Frontend
```bash
cd frontend
npm install
npm run dev
```
Default URL: `http://localhost:5173`

### Running Automated Test Suites
- **Backend Tests (63 regression + Phase 11 validation tests)**:
  ```bash
  cd backend
  npm test
  ```
- **Frontend Integration Tests (37 comprehensive integration tests)**:
  ```bash
  cd frontend
  npm test
  ```
