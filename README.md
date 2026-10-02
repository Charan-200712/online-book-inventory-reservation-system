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
Phase 1 — Project Initialization & Architecture

## Planned Features
* User authentication
* Book management
* Author management
* Live book search
* Inventory management
* Book reservations
* Issue and return tracking
* Transaction history
* Admin dashboard

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
