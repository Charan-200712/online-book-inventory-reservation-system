# Production Verification Specification & Deployment Record

**Project Title:** Online Book Inventory & Reservation System  
**Phase:** Phase 20 — GitHub Publication & Production Deployment  
**Environment Target:** Cloud Production (Render / Railway / Vercel + Cloud MySQL)  
**Verification Date:** October 2026  
**Status:** Deployment-Engineered & Awaiting Remote Service Provisioning  

---

## 1. Production Architecture Overview

The system is architected for decoupled cloud hosting across three tiers:

```text
┌────────────────────────────────────────────────────────┐
│             FRONTEND: React 18 / Vite SPA              │
│  - Hosting: Vercel / Netlify / Render Static Site      │
│  - SPA Routing: Rewrites /* -> /index.html             │
│  - Base URL: Configured via VITE_API_BASE_URL          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (Bearer JWT)
                            ▼
┌────────────────────────────────────────────────────────┐
│          BACKEND: Node.js / Express REST API           │
│  - Hosting: Render Web Service / Railway / VPS PM2     │
│  - Port Binding: Dynamic process.env.PORT              │
│  - CORS: Configured via CLIENT_URL (Frontend origin)   │
│  - Health Check Probe: /api/health                     │
└───────────────────────────┬────────────────────────────┘
                            │ MySQL Protocol (with SSL)
                            ▼
┌────────────────────────────────────────────────────────┐
│            DATABASE: Managed MySQL 8.0 Engine          │
│  - Hosting: Aiven / PlanetScale / TiDB / Railway MySQL │
│  - DDL Schema: database/schema.sql (5 tables)          │
│  - Security: SSL Connection (DB_SSL=true)              │
└────────────────────────────────────────────────────────┘
```

---

## 2. Production Environment Variables Reference

### Backend Service (`backend/.env` / Cloud Dashboard)
| Variable | Production Value / Description | Required? |
|---|---|:---:|
| `NODE_ENV` | `production` | Yes |
| `PORT` | Dynamic port provided by host (e.g. `5000` or `$PORT`) | Yes |
| `DB_HOST` | Hostname of managed MySQL instance | Yes |
| `DB_PORT` | Port of managed MySQL instance (default `3306`) | Yes |
| `DB_USER` | MySQL database username | Yes |
| `DB_PASSWORD`| Secure password for MySQL user | Yes |
| `DB_NAME` | `library_db` (or provisioned database name) | Yes |
| `DB_SSL` | `true` (enables secure SSL handshake for cloud DBs) | Yes |
| `JWT_SECRET` | Cryptographically random secret string (>= 32 chars) | Yes |
| `JWT_EXPIRES_IN`| `24h` | Yes |
| `CLIENT_URL` | Production URL of deployed frontend (for CORS whitelist) | Yes |

### Frontend Service (`frontend/.env` / Cloud Dashboard)
| Variable | Production Value / Description | Required? |
|---|---|:---:|
| `VITE_API_BASE_URL` | Public HTTPS URL of deployed backend (e.g. `https://api.library.edu/api`) | Yes |

---

## 3. End-to-End Production Verification Protocol

Once remote cloud resources are linked and deployed, the following live verification tests must be executed:

### Phase A: Infrastructure & Health Probing
1. Send `GET /api/health` to the live backend URL.
2. Confirm response status is `HTTP 200`.
3. Confirm response body contains:
   ```json
   {
     "success": true,
     "message": "Backend service is healthy",
     "database": "connected"
   }
   ```
4. Verify root health welcome route: `GET /` returns API directory metadata.

### Phase B: Frontend SPA Loading & Routing
1. Open the live frontend URL in an incognito browser window.
2. Confirm the home page renders with zero console errors.
3. Test direct deep linking: Navigate directly to `/books` and refresh page; confirm `_redirects` / `vercel.json` rewrites resolve `index.html` without returning 404.

### Phase C: Patron Workflow
1. Register a new user (`patron.test@university.edu`).
2. Login and verify JWT token storage in `localStorage`.
3. Live Search: Query `Clean` and confirm 300ms debounced search results.
4. Filter available books: Toggle `Available Only` checkbox.
5. Reserve an available book: Confirm atomic hold creation and stock decrement.
6. Open Patron Dashboard: Confirm active reservation displays `PENDING` status badge.
7. Cancel reservation: Confirm hold cancellation and physical stock restoration.
8. Logout: Confirm session teardown.

### Phase D: Administrator Workflow
1. Login as Administrator (`admin@library.edu`).
2. Verify Admin Dashboard metrics: Total Titles, Inventory, Active Holds, Loans, Overdue.
3. Book & Author Management: Create new book and test author referential integrity guard.
4. Reservation Oversight: Approve a pending patron hold.
5. Circulation Desk: Issue physical copy with automated 14-day due date; process return.
6. Verify Overdue Monitoring ledger.

---

## 4. Security & Compliance Checklist

- [x] **Zero Credentials in Git:** All secrets excluded via `.gitignore`; repository contains only sanitized templates.
- [x] **Parameterized Queries:** 100% of SQL statements parameterized against SQL injection.
- [x] **Password Protection:** All passwords hashed with salted bcrypt (10 rounds).
- [x] **Role-Based Guards:** `authMiddleware` and `roleMiddleware` reject unauthorized access with HTTP 401/403.
- [x] **CORS Whitelisting:** Backend restricts requests strictly to the configured `CLIENT_URL`.
- [x] **Database SSL Support:** `DB_SSL=true` flag supported for encrypted cloud database connections.

---
