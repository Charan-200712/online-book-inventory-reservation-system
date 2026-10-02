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
Phase 7 — React Frontend Foundation & API Integration (Complete)

## Implemented & Planned Features
* [x] Project architecture & Express setup (Phase 1)
* [x] MySQL relational schema & seed data (Phase 2)
* [x] Express backend foundation & connection pool (Phase 3)
* [x] User authentication & JWT authorization (Phase 4)
* [x] Book & author management APIs with live search & inventory rules (Phase 5)
* [x] Book reservations & concurrency-safe inventory holds (Phase 6)
* [x] Circulation transactions (issue, return, due dates, overdue detection) (Phase 6)
* [x] React frontend foundation, routing, JWT auth context & API integration (Phase 7)
* [ ] Live book search, controlled forms & useEffect synchronization (Phase 8)
* [ ] Complete reservation & loan circulation user/admin workflows (Phase 9+)

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
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
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
