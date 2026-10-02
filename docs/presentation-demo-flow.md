# Project Demonstration Flow: Step-by-Step Live Execution Guide

**Project:** Online Book Inventory & Reservation System  
**Purpose:** Standard Operating Procedure for Live Viva Examination & Academic Review Demonstrations  
**Total Target Demonstration Time:** 5 to 7 Minutes  
**Prerequisites:** MySQL 8.0 running on localhost:3306 with `library_db` populated from `schema.sql` and `seed.sql`.

---

## Pre-Demo Preparation (Terminal Setup)

Open three organized terminal windows or tabs:
- **Terminal 1 (Backend Server):** `cd backend`
- **Terminal 2 (Frontend Client):** `cd frontend`
- **Terminal 3 (Health Check & Queries):** Root directory

---

## 18-Step Live Demonstration Sequence

### Step 1: Start & Verify MySQL Service
Ensure MySQL is actively listening on port 3306.
```bash
# Verify database accessibility
mysql -u root -p -e "USE library_db; SHOW TABLES;"
```
*Expected Output:* Displays 5 tables: `authors`, `books`, `reservations`, `transactions`, `users`.

---

### Step 2: Start Backend Server
In **Terminal 1**:
```bash
cd backend
npm start
```
*Expected Output:*
```text
Connected to MySQL database: library_db
Server running on http://localhost:5000
```

---

### Step 3: Verify Health Probe Endpoint
In **Terminal 3** or browser:
```bash
curl http://localhost:5000/api/health
```
*Expected Output:*
```json
{"success":true,"message":"Backend service is healthy","database":"connected","timestamp":"..."}
```
*Examiner Talking Point:* "The backend exposes a health check endpoint for load balancers and uptime monitors, verifying database connectivity."

---

### Step 4: Start Frontend Client
In **Terminal 2**:
```bash
cd frontend
npm run dev
```
*Expected Output:*
```text
  VITE v5.4.14  ready in 240 ms
  ➜  Local:   http://localhost:5173/
```
Open Chrome/browser to `http://localhost:5173/`.

---

### Step 5: Login as USER (Patron Role)
1. In the top navigation bar, click **Sign In**.
2. Enter student credentials:
   - **Email:** `rahul.sharma@college.edu`
   - **Password:** `Student@123`
3. Click **Sign In**.
*Expected Output:* The navigation bar updates to show patron credentials: `Welcome, Rahul Sharma (USER)` and reveals the **Dashboard** link.

---

### Step 6: Live Catalog Search
1. Navigate to **Books** (`http://localhost:5173/books`).
2. Point cursor to the search box and type `Clean`.
3. Notice that results update seamlessly without page reload.
*Examiner Talking Point:* "Our custom `useDebounce` hook pauses for 300 milliseconds after typing stops, dispatching a single query across titles, authors, categories, and ISBNs."

---

### Step 7: Filter by Availability
1. Clear the search box.
2. Check the **"Available Only"** checkbox.
*Expected Output:* The catalog instantly re-renders to exclude any titles whose `available_copies` equals 0.

---

### Step 8: View Book Details
1. Click **View Details** on *"Clean Code"* (or another available title).
2. URL routes to `http://localhost:5173/books/1`.
*Expected Output:* Detailed view displays Title, Author, ISBN, Category, Total Copies, Available Copies badge, and the **Reserve Book** action button.

---

### Step 9: Create a Concurrency-Safe Reservation
1. On the Book Details page, click **Reserve Book**.
*Expected Output:* 
- A green alert banner appears: *"Reservation placed successfully!"*
- The available copy count on screen immediately decrements by 1.
*Examiner Talking Point:* "The reservation is executed inside an atomic SQL transaction with an InnoDB row lock (`SELECT ... FOR UPDATE`), preventing double-booking if another user clicks simultaneously."

---

### Step 10: Open Patron Dashboard
1. Click **Dashboard** in the top navigation bar (`http://localhost:5173/dashboard`).
*Expected Output:*
- Profile card displays member details: Rahul Sharma, `rahul.sharma@college.edu`, Role: `USER`.
- **Active Reservations** table shows the newly created reservation with status badge `PENDING`.
- A **Cancel Reservation** button is present if the patron wishes to relinquish the hold.

---

### Step 11: Patron Logout
1. In the top navigation bar, click **Logout**.
*Expected Output:* The session clears from `localStorage`, and the UI returns to the public unauthenticated state.

---

### Step 12: Login as ADMIN (Librarian Role)
1. Click **Sign In**.
2. Enter administrative credentials:
   - **Email:** `admin@library.edu`
   - **Password:** `Admin@123`
3. Click **Sign In**.
*Expected Output:* The navbar displays `Welcome, Administrator (ADMIN)` and displays the **Admin Panel** link.

---

### Step 13: Open Administrator Dashboard
1. Click **Admin Panel** (`http://localhost:5173/admin`).
*Expected Output:* Overview dashboard displays top metric summary cards:
- Total Titles
- Total Book Inventory
- Active Reservations
- Books on Loan
- Overdue Books Count

---

### Step 14: Demonstrate Book & Author Management
1. Click the **Books** tab in the admin console.
   - Show catalog table with Edit, Delete, and stock adjust buttons.
   - Click **+ Add New Book** to demonstrate the modal with validation.
2. Click the **Authors** tab.
   - Show author list with biographies and associated book counts.
   - *Examiner Talking Point:* "Referential integrity is strictly protected. Attempting to delete an author who has books in the library is rejected by the database with a 409 conflict error."

---

### Step 15: Approve Patron Reservation
1. Click the **Reservations** tab in the admin panel.
2. Locate the `PENDING` reservation placed by Rahul Sharma in Step 9.
3. Click the **Approve** button.
*Expected Output:* Status badge transitions immediately from `PENDING` to `APPROVED`.

---

### Step 16: Demonstrate Circulation Workflow (Issue & Return)
1. Click the **Circulation** tab.
2. Click **Issue Book**:
   - Select Patron: Rahul Sharma.
   - Select Book / Fulfill approved reservation.
   - Click **Issue Book**.
   *Expected Output:* Active loan record appears with today's date as `issue_date` and an automated `due_date` exactly 14 days in the future.
3. Point out the **Return Book** action:
   - Click **Return Book**.
   *Expected Output:* The loan status transitions to `RETURNED`, return date is recorded, and the book's physical shelf inventory increments back by 1.

---

### Step 17: Inspect Transaction History & Overdue Monitoring
1. Show the completed circulation ledger in the admin panel.
2. Point out the Overdue filter view:
   *Examiner Talking Point:* "Loans are flagged as overdue in real-time when `status = 'ISSUED'` and `due_date < CURDATE()`, enabling staff to follow up with patrons."

---

### Step 18: Administrative Logout & Wrap-Up
1. Click **Logout** in the navigation bar.
2. The UI returns to the clean public landing page.
3. Conclude: "This concludes the live operational demonstration of the Online Book Inventory and Reservation System. We are now open for technical questions."

---
