# Project Demonstration & Viva Checklist

This document provides a practical, step-by-step demonstration walkthrough for the **Online Book Inventory & Reservation System**. It is designed for college project evaluation, viva presentations, demo recordings, and practical assessment.

---

## Pre-Demo Preparation

### Seed Account Credentials
| Role | Email | Password | Purpose |
|---|---|---|---|
| **Administrator** | `admin@library.edu` | `Admin@123` | System oversight, catalog CRUD, circulation desk |
| **Patron (Student)** | `rahul.sharma@college.edu` | `Student@123` | Regular user for holds and borrowing |
| **Patron (Student)** | `priya.patel@college.edu` | `Student@123` | Secondary user for concurrency/privacy testing |

---

## 20-Step Demonstration Walkthrough

### Step 1: Start MySQL Database Server
1. Verify MySQL Service is running locally on port `3306`:
   ```bash
   mysqladmin -u root -p ping
   ```
2. Confirm `library_db` is initialized:
   ```bash
   mysql -u root -p -e "SHOW TABLES IN library_db;"
   ```
   *Expected: `authors`, `books`, `reservations`, `transactions`, `users`.*

---

### Step 2: Start Express Backend API
1. Open a new terminal:
   ```bash
   cd backend
   npm start
   ```
2. Verify startup log:
   ```text
   [DATABASE] Database connection pool established successfully
   [SERVER] Online Book Inventory API is running on port 5000
   [SERVER] Health check: http://localhost:5000/api/health
   ```

---

### Step 3: Verify Health Endpoint
1. In a browser or terminal, navigate to:
   ```text
   http://localhost:5000/api/health
   ```
2. Point out the JSON response:
   ```json
   {
     "success": true,
     "message": "Online Book Inventory & Reservation System API is running",
     "database": "connected"
   }
   ```
   *Viva Talking Point: Demonstrates backend readiness probing for load balancers and container orchestrators.*

---

### Step 4: Start React Frontend (Vite)
1. Open a second terminal:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open your browser to `http://localhost:5173`.
3. Highlight the clean landing page (`Home`), responsive navigation bar, and public information.

---

### Step 5: Demonstrate Patron Registration & Login
1. Click **Register** in the navigation bar.
2. Register a new patron (e.g., `Amit Verma`, `amit.verma@college.edu`, `Student@123`).
3. Click **Login** and authenticate as:
   - Email: `rahul.sharma@college.edu`
   - Password: `Student@123`
4. Point out that the navigation updates dynamically:
   - "Welcome, Rahul Sharma (USER)" badge appears.
   - Links to **Books**, **Authors**, and **Dashboard** are now active.
   - Administrative link (`/admin`) is hidden.

---

### Step 6: Demonstrate Live Book Search
1. Navigate to **Books**.
2. Type in the search input:
   - Search by Title: type `Clean` $\to$ instant debounced results show "Clean Code" and "Clean Architecture".
   - Search by ISBN: type `978-0132350884` $\to$ exact match for "Clean Code".
   - Search by Author: type `Tanenbaum` $\to$ displays "Computer Networks" and "Modern Operating Systems".
   - Search by Category: type `Algorithms` $\to$ displays "Introduction to Algorithms".
3. *Viva Talking Point: Explain the 300ms custom `useDebounce` hook that prevents excessive server requests while typing.*

---

### Step 7: Demonstrate Availability Filter
1. In the **Books** catalog page, toggle the **Available Only** checkbox.
2. Point out that only books with `available_copies > 0` are displayed.
3. Observe the green stock badge: e.g., "Available: 4 / 5 copies".

---

### Step 8: Demonstrate Book Details & Author Biography
1. Click on **View Details** for "Clean Code".
2. View the full book details: ISBN, Category, Description, and Author link.
3. Click on the author's name ("Robert C. Martin").
4. Point out the author biography modal/page and the list of all books written by this author.
5. *Viva Talking Point: Highlights relational data integrity (`authors` $1 \to N$ `books` via `author_id`).*

---

### Step 9: Create a Book Reservation
1. On the "Clean Code" details page, click the **Reserve Book** button.
2. Observe the immediate feedback:
   - Success alert banner: "Reservation placed successfully!"
   - Available copies decrements from 4 to 3 on the shelf immediately.
3. Click the **Reserve Book** button again to test guardrails:
   - Red alert banner: "You already have an active reservation for this book."
4. *Viva Talking Point: Explains the MySQL `SELECT ... FOR UPDATE` row lock preventing negative inventory and duplicate active holds.*

---

### Step 10: Open Patron Dashboard
1. Click **Dashboard** in the navigation bar.
2. Point out the 3 sections:
   - **Profile Overview**: Member name, email, role badge (`USER`).
   - **Active Reservations**: Shows the pending reservation for "Clean Code" with status `PENDING`.
   - **Circulation History**: Lists previously issued and returned books with due dates.
3. Demonstrate self-service cancellation:
   - Click **Cancel Reservation** on the hold.
   - The status updates to `CANCELLED`.
   - Re-check the book catalog: the available copies increments back by 1!

---

### Step 11: Login as Administrator
1. Click **Logout**.
2. Navigate to **Login** and authenticate with administrator credentials:
   - Email: `admin@library.edu`
   - Password: `Admin@123`
3. Point out the administrative navigation:
   - Admin badge: "Admin: System Administrator (ADMIN)".
   - New **Admin Portal** navigation item appears.

---

### Step 12: Open Admin Dashboard & System Metrics
1. Click **Admin Portal** (`/admin`).
2. Point out the top summary metrics cards:
   - **Total Titles**
   - **Total Inventory Stock**
   - **Active Reservation Holds**
   - **Books Currently on Loan**
   - **Overdue Books Alert Count**

---

### Step 13: Demonstrate Book Management (Admin CRUD)
1. Switch to the **Books Management** tab.
2. Click **+ Add New Book**:
   - Title: `Cloud Native Distributed Systems`
   - ISBN: `978-0139988776`
   - Author: Select `Martin Fowler`
   - Category: `Cloud Computing`
   - Total Copies: `4`
   - Available Copies: `4`
3. Submit form $\to$ book immediately appears in the catalog table.
4. Click **Edit**:
   - Update title to `Cloud Native Distributed Systems (2nd Ed)`.
   - Change total copies to `5`.
   - Save $\to$ table reflects updated values.

---

### Step 14: Demonstrate Author Management & Referential Protection
1. Switch to the **Authors Management** tab.
2. Click **+ Add New Author**:
   - Name: `Gene Kim`
   - Biography: `Author of The Phoenix Project and DevOps Handbook.`
3. Submit $\to$ author added.
4. Demonstrate referential protection:
   - Attempt to delete `Robert C. Martin` (who has existing catalog titles).
   - Point out error alert: `"Cannot delete author because related books depend on it."`
   - *Viva Talking Point: Demonstrates database referential integrity (`ON DELETE RESTRICT` / conflict detection).*

---

### Step 15: Demonstrate Reservation Oversight & Approval
1. Switch to the **Reservations** tab.
2. Locate a patron's reservation with status `PENDING`.
3. Click the **Approve** button.
4. The status updates from `PENDING` $\to$ `APPROVED`.
5. Point out that the hold is now ready for physical book collection at the circulation desk.

---

### Step 16: Demonstrate Book Issuance (Circulation Desk)
1. Switch to the **Circulation Desk** tab.
2. Click **Issue Book**:
   - Select Patron: `Rahul Sharma`
   - Select Book: `Clean Code`
   - Select Approved Reservation: select the reservation from Step 15.
3. Click **Confirm Issue**:
   - Transaction created with status `ISSUED`.
   - Scheduled Due Date is automatically calculated as **Issue Date + 14 Days**.
   - Linked reservation transitions from `APPROVED` $\to$ `COMPLETED`.

---

### Step 17: Demonstrate Book Return
1. In the **Circulation Desk** records table, locate the issued transaction.
2. Click **Process Return**:
   - Status transitions from `ISSUED` $\to$ `RETURNED`.
   - Actual return date is stamped (`CURDATE()`).
   - Physical shelf inventory (`available_copies`) increments by 1 automatically.
3. Attempt to return the same transaction again:
   - Blocked with conflict notification: `"This book has already been returned."`

---

### Step 18: Demonstrate Overdue Loan Monitoring
1. In the Circulation records, filter by **Overdue Loans**.
2. Point out the seeded loan for "Computer Networks" issued 25 days ago.
3. Explain that the system flags any loan where `status = 'ISSUED'` and `due_date < CURDATE()`.

---

### Step 19: Demonstrate Defensive Error Handling & Input Validation
1. Log out and navigate to **Login**.
2. Submit an empty form $\to$ client-side inline validation alerts: `"Email is required"`, `"Password is required"`.
3. Submit invalid email format $\to$ `"Please enter a valid email address"`.
4. Attempt to access a nonexistent book URL: `http://localhost:5173/books/999999` $\to$ user-friendly error card: `"Book not found"`.
5. Attempt to access an invalid URL: `http://localhost:5173/unknown-page` $\to$ clean 404 page with return home button.

---

### Step 20: Security & Architecture Review (Viva Summary)
1. **JWT Stateless Authentication**: Show the JWT in browser `localStorage` and explain the Authorization header: `Bearer <token>`.
2. **Password Security**: Show `database/seed.sql` and `users` table demonstrating bcrypt 10-round salted password hashes.
3. **Automated Test Coverage**: Run `npm test` from the terminal to show all **132 automated tests** passing in under 2 seconds.
4. **Clean Production Build**: Run `npm run build:frontend` to demonstrate Vite compiling with 0 errors.

---

## Quick Reference Commands

```bash
# Verify all automated tests (132 tests)
npm test

# Verify frontend production build
npm run build:frontend

# Run Phase 15 E2E Verification Suite
cd backend && npm run test:e2e
```
