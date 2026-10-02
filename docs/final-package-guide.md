# Final Submission Package & Repository Guide

**Project Title:** Online Book Inventory & Reservation System  
**Repository Branch:** `master`  
**Purpose:** Comprehensive guide for evaluators, examiners, and developers to navigate, reconstruct, run, and evaluate the submission package.

---

## 1. Project Overview

The **Online Book Inventory & Reservation System** is a full-stack, concurrency-safe web application designed for academic and departmental libraries. It digitizes book discovery, real-time availability tracking, transaction-safe patron reservations, and physical circulation management (issuance, automated 14-day due dates, returns, and overdue tracking) with role-based access control.

---

## 2. Main Components

The repository is structured into four cohesive, decoupled subsystems:

```text
FSD_PROJECT/
├── frontend/     # React 18 + Vite Single-Page Application (SPA)
├── backend/      # Node.js + Express REST API (Layered: Routes, Controllers, Services)
├── database/     # MySQL 8.0 DDL Schema, Seed Data, and Data Dictionary
└── docs/         # 18 Technical Reports, Presentation Decks, and Viva Guides
```

1. **Frontend (`frontend/`)**: Built using React 18, Vite 5, React Router v6, custom CSS design tokens, and Context API (`AuthContext`). Includes debounced search (`useDebounce`), role-guarded routes, and modal dialogs.
2. **Backend (`backend/`)**: Built using Node.js and Express.js, featuring layered separation of concerns, connection-pooled database access (`mysql2`), JWT authentication (24h lifespan), salted bcrypt password hashing, and centralized error middleware.
3. **Database (`database/`)**: Relational MySQL 8.0 schema with 5 normalized tables (`users`, `authors`, `books`, `reservations`, `transactions`), check constraints (`0 <= available_copies <= total_copies`), foreign keys, and indexes.
4. **Documentation & Evaluation Assets (`docs/`)**: Complete set of academic reports, presentation slides, viva guides, and execution checklists.

---

## 3. How to Start the System from Scratch

Follow this exact sequence to reconstruct and run the system on any clean machine equipped with Node.js (v18+) and MySQL Server (8.0+):

### Step 1: Start MySQL & Initialize Database
Ensure MySQL Server is running locally on port 3306.
```bash
# 1. Execute schema to create library_db and tables
mysql -u root -p < database/schema.sql

# 2. Populate standard sample data and default test accounts
mysql -u root -p < database/seed.sql
```

### Step 2: Configure Environment Variables
Copy the provided environment templates:
```bash
# In backend directory
cp backend/.env.example backend/.env

# In frontend directory
cp frontend/.env.example frontend/.env
```
*Note:* Adjust `DB_USER`, `DB_PASSWORD`, and `JWT_SECRET` in `backend/.env` according to your local MySQL environment.

### Step 3: Install Dependencies & Start Backend Server
```bash
cd backend
npm install
npm start
```
The backend initializes the connection pool and starts listening on `http://localhost:5000`.  
Verify health: `curl http://localhost:5000/api/health`

### Step 4: Install Dependencies & Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will be accessible at `http://localhost:5173/`.

### Default Seeded Test Credentials:
| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Administrator** | `admin@library.edu` | `Admin@123` | Full catalog CRUD, author management, reservation approval, circulation desk |
| **Student / Patron** | `rahul.sharma@college.edu` | `Student@123` | Book search, real-time availability, reservation holds, loan history |
| **Student / Patron** | `priya.patel@college.edu` | `Student@123` | Secondary patron account for testing concurrent reservations |

---

## 4. Key Documentation References

For specific evaluation tasks, refer to the corresponding documents in the [`docs/`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/README.md) directory:

| Evaluation Need | Primary Document | Description |
|---|---|---|
| **Live Project Demo** | [`docs/demo-script.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/demo-script.md) & [`docs/presentation-demo-flow.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/presentation-demo-flow.md) | Structured 18-step presentation flow and spoken demonstration dialogue. |
| **Project Presentation** | [`docs/final-presentation.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/final-presentation.md) | 18-Slide presentation deck complete with timed speaker scripts. |
| **Viva Examination** | [`docs/viva-questions.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/viva-questions.md) & [`docs/viva-quick-revision.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/viva-quick-revision.md) | 55 comprehensive viva questions and answers plus a 1-page quick revision sheet. |
| **Verbal Introductions** | [`docs/project-introduction.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/project-introduction.md) | 30-second, 1-minute, and 2-minute introductory pitches for viva and review panels. |
| **Formal College Report**| [`docs/final-project-report.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/final-project-report.md) | Formal 25-section college project report covering architecture, DDL, and modules. |
| **Testing & Quality** | [`docs/testing.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/testing.md) | Detailed test strategy, 8 test suites, 192+ verifications, and regression logs. |
| **Production Deployment**| [`docs/deployment.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/deployment.md) | Production readiness guide, Nginx reverse proxy configuration, and PM2 process setup. |
| **API Quick Reference** | [`docs/api-quick-reference.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/api-quick-reference.md) | Directory of all RESTful HTTP endpoints, query parameters, and status codes. |
| **Screenshot Catalog** | [`docs/screenshot-checklist.md`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/docs/screenshot-checklist.md) | 33-point screenshot guide and slide-by-slide image mapping. |

---

## 5. Automated Verification & Testing Commands

To reproduce the automated verification results:

```bash
# Run all 8 automated test suites (Backend + Frontend Integration)
npm test

# Run frontend production build
npm run build:frontend
```
- **Test Pass Rate:** 100% (192+ assertions verified across 8 suites).
- **Build Result:** Vite compiles cleanly into `frontend/dist/` in ~6.11 seconds with 0 warnings or errors.

---

## 6. Critical Security Policies & Submission Rules

> [!CAUTION]
> **Zero-Secrets Policy:**
> 1. Never commit real passwords, production database credentials, or secret keys to Git.
> 2. The `.gitignore` file strictly excludes all `.env` files, `node_modules/`, and build artifacts (`dist/`).
> 3. Only sanitized example templates (`.env.example`) are tracked in the repository.
> 4. All SQL queries use parameterized placeholders (`?`) to prevent SQL injection.
> 5. All passwords in the database are salted bcrypt hashes; plaintext passwords are never stored.

---
