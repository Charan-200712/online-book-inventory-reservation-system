# Practical Demonstration Script: 5–10 Minute Walkthrough

This script provides a concise, step-by-step presentation script designed for a 5-to-10 minute project evaluation or live demonstration.

---

## Pre-Demonstration Setup (Before Evaluators Arrive)

1. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   npm start
   ```
2. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open browser to `http://localhost:5173`.
4. Ensure test credentials are ready:
   - Patron: `rahul.sharma@college.edu` / `Student@123`
   - Admin: `admin@library.edu` / `Admin@123`

---

## 10-Part Demonstration Script

### Part 1 — Introduction (Time: 0:00 – 1:00)
**Presenter Dialogue:**
> *"Good morning respected evaluators. Today I am presenting the **Online Book Inventory & Reservation System**, a full-stack departmental library management application engineered using React 18, Node.js, Express.js, and a MySQL relational database.*  
> *The system addresses common library bottlenecks: inaccurate physical stock, race conditions when reserving last copies, manual loan tracking, and lack of patron self-service. I will now walk through the system from both the patron and administrator perspectives."*

---

### Part 2 — Patron Login (Time: 1:00 – 1:45)
**Presenter Actions:**
1. Point out the landing page on `http://localhost:5173`.
2. Click **Login** in the top navigation bar.
3. Enter:
   - Email: `rahul.sharma@college.edu`
   - Password: `Student@123`
4. Click **Sign In**.

**Presenter Dialogue:**
> *"Here, our patron authenticates against our Express REST API. The backend verifies credentials using salted bcrypt hashing and issues a signed JSON Web Token stored in client memory. The top navigation updates dynamically to show the patron's name and role badge."*

---

### Part 3 — Catalog Discovery & Live Search (Time: 1:45 – 3:00)
**Presenter Actions:**
1. Click **Books** in the navigation bar.
2. In the search input, type: `Clean`.
3. Point out that the list filters in real time to show "Clean Code" and "Clean Architecture".
4. Clear the text and type ISBN `978-0132350884` $\to$ shows exact match.
5. Toggle the **Available Only** checkbox.
6. Click **View Details** on "Clean Code".

**Presenter Dialogue:**
> *"Our catalog includes a live debounced search bar. Using a custom 300ms `useDebounce` hook, the frontend avoids firing queries on every keystroke, reducing server load. We can search across title, ISBN, author name, or category. Notice the stock indicators showing total physical copies versus available shelf copies."*

---

### Part 4 — Creating a Reservation Hold (Time: 3:00 – 4:00)
**Presenter Actions:**
1. On the "Clean Code" details page, point out the current available copies (e.g., 4 copies).
2. Click the **Reserve Book** button.
3. Observe the green confirmation alert banner: *"Reservation placed successfully!"*
4. Point out that available copies immediately decrements to 3.

**Presenter Dialogue:**
> *"When the patron reserves a book, the backend starts an ACID database transaction and applies a row-level lock using MySQL's `SELECT ... FOR UPDATE`. This guarantees that even if two patrons click Reserve at the exact same millisecond, the physical stock will never become negative and no double-reserving can occur."*

---

### Part 5 — Patron Dashboard & Self-Service (Time: 4:00 – 5:00)
**Presenter Actions:**
1. Click **Dashboard** in the navigation bar.
2. Show the **Profile Overview** card.
3. Show the **Active Reservations** table, highlighting the pending hold for "Clean Code".
4. Show the **Circulation History** table displaying previously borrowed titles and due dates.
5. Click **Cancel Reservation** on the hold $\to$ status changes to `CANCELLED` and inventory copy restores.

**Presenter Dialogue:**
> *"The Patron Dashboard gives students complete self-service transparency. They can monitor active holds, view due dates, and cancel reservations if they change their mind, which automatically restores the physical copy to the library shelf."*

---

### Part 6 — Admin Login (Time: 5:00 – 5:45)
**Presenter Actions:**
1. Click **Logout**.
2. Click **Login** and authenticate with:
   - Email: `admin@library.edu`
   - Password: `Admin@123`
3. Point out that the navigation now displays the **Admin Portal** link.

**Presenter Dialogue:**
> *"Now I am logging in as the library administrator. Notice that our route guard and navigation bar detect the `ADMIN` role from the JWT claims, exposing the administrative management interface."*

---

### Part 7 — Admin Dashboard & Metrics (Time: 5:45 – 6:45)
**Presenter Actions:**
1. Click **Admin Portal** (`/admin`).
2. Point out the top summary metric cards:
   - **Total Titles**
   - **Total Stock**
   - **Active Holds**
   - **Books Currently Issued**
   - **Overdue Books Alert Count**

**Presenter Dialogue:**
> *"The Admin Dashboard provides real-time operational metrics summarizing catalog size, active holds, current loans, and overdue alerts across the entire department."*

---

### Part 8 — Circulation: Hold Approval, Book Issue & Return (Time: 6:45 – 8:30)
**Presenter Actions:**
1. Switch to the **Reservations** tab $\to$ locate a pending hold $\to$ click **Approve**.
2. Switch to the **Circulation Desk** tab.
3. Click **Issue Book**:
   - Select Patron: `Rahul Sharma`
   - Select Book: `Clean Code`
   - Select the approved reservation.
   - Click **Confirm Issue**.
4. Point out that the loan is recorded with a **14-Day Due Date** automatically calculated.
5. In the active loans table, click **Process Return**:
   - Status updates to `RETURNED`.
   - Return date is stamped with today's date.
   - Shelf inventory increments by 1.

**Presenter Dialogue:**
> *"Here is the complete circulation workflow. Library staff approve the hold, issue the physical copy at the desk—which automatically marks the reservation as completed and calculates a 14-day due date—and later process the return with a single click, instantly restocking the physical shelf."*

---

### Part 9 — Defensive Error Handling & Guardrails (Time: 8:30 – 9:30)
**Presenter Actions:**
1. Attempt to process a return on an already returned transaction $\to$ shows conflict alert: *"This book has already been returned."*
2. Navigate to **Authors** tab $\to$ attempt to delete author "Robert C. Martin" $\to$ blocked with: *"Cannot delete author because related books depend on it."*
3. Open a direct browser URL to a nonexistent book: `http://localhost:5173/books/999999` $\to$ clean "Book not found" page.

**Presenter Dialogue:**
> *"Our application is hardened against edge cases. Referential integrity constraints prevent accidental deletion of authors with active books, double-returns are rejected with HTTP 409 Conflict, and invalid routes display polite, user-friendly fallback cards without ever leaking database errors or stack traces."*

---

### Part 10 — Conclusion & Q&A Readiness (Time: 9:30 – 10:00)
**Presenter Dialogue:**
> *"To conclude, the system provides a robust, transaction-safe, full-stack solution with 8 automated test suites passing with a 100% success rate, clean Vite production builds, and full documentation. Thank you, and I am now ready for any questions."*
