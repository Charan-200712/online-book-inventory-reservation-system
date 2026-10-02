# College Report Screenshot Checklist

This checklist provides a structured guide of the recommended screenshots to capture for inclusion in the final college project report, viva presentation slides, and portfolio documentation.

---

## Part 1: Public & Authentication Views

| # | Screen / State | URL / Viewport | What to Capture / Highlight |
|---|---|---|---|
| **01** | **Landing / Home Page** | `http://localhost:5173/` | Hero banner, application features summary, public navigation bar with Login/Register links. |
| **02** | **Patron Registration Form** | `http://localhost:5173/register` | Controlled form inputs for Full Name, Email, Password, and registration submit button. |
| **03** | **Registration Validation Alert** | `http://localhost:5173/register` | Form submission with duplicate email or password < 6 characters showing red inline error banner. |
| **04** | **Patron Login Page** | `http://localhost:5173/login` | Clean login card, Email and Password inputs, and Sign In action button. |
| **05** | **Post-Login Patron Navigation** | Navigation Bar | Authenticated state showing "Welcome, Rahul Sharma (USER)" badge and links to Books, Authors, Dashboard. |

---

## Part 2: Catalog Discovery & Search Views

| # | Screen / State | URL / Viewport | What to Capture / Highlight |
|---|---|---|---|
| **06** | **Full Book Catalog Grid** | `http://localhost:5173/books` | Grid of book cards showing titles, authors, categories, ISBNs, and physical stock badges. |
| **07** | **Live Search by Keyword** | `http://localhost:5173/books` | Search input with text `Clean` displaying real-time debounced results ("Clean Code" & "Clean Architecture"). |
| **08** | **Live Search by ISBN** | `http://localhost:5173/books` | Search input with `978-0132350884` displaying single exact title match. |
| **09** | **Availability Filter Toggled** | `http://localhost:5173/books` | "Available Only" checkbox checked, showing only books where `available_copies > 0`. |
| **10** | **Empty Search State** | `http://localhost:5173/books` | Search for a nonexistent term showing friendly empty state: *"No books match your criteria."* |
| **11** | **Book Details Page** | `http://localhost:5173/books/1` | Expanded view with title, author link, publication category, synopsis, stock indicator, and **Reserve** button. |
| **12** | **Author Directory & Profile** | `http://localhost:5173/authors` | Author cards showing biography and list of catalog books linked to that author. |

---

## Part 3: Patron Dashboard & Reservation Views

| # | Screen / State | URL / Viewport | What to Capture / Highlight |
|---|---|---|---|
| **13** | **Reservation Confirmation Banner**| `http://localhost:5173/books/1` | Green alert banner after clicking Reserve: *"Reservation placed successfully!"* and decremented shelf count. |
| **14** | **Duplicate Hold Rejection** | `http://localhost:5173/books/1` | Clicking Reserve a second time showing red conflict banner: *"You already have an active reservation for this book."* |
| **15** | **Patron Dashboard Overview** | `http://localhost:5173/dashboard` | Profile overview card (Member Name, Email, Role) and summary metrics. |
| **16** | **Active Holds Tab** | `http://localhost:5173/dashboard` | Table showing reserved book title, hold date, `PENDING` status badge, and **Cancel** button. |
| **17** | **Circulation History Tab** | `http://localhost:5173/dashboard` | Table showing borrowed titles, issue dates, 14-day due dates, and return statuses (`ISSUED`, `RETURNED`). |

---

## Part 4: Administrative Dashboard & Management Views

| # | Screen / State | URL / Viewport | What to Capture / Highlight |
|---|---|---|---|
| **18** | **Admin Dashboard Overview** | `http://localhost:5173/admin` | Top summary metric cards (Total Titles, Total Inventory, Active Holds, Books on Loan, Overdue Count). |
| **19** | **Book Management Console** | `http://localhost:5173/admin` (Books Tab) | Searchable catalog table with Edit, Delete, and stock adjustment actions. |
| **20** | **Add / Edit Book Modal** | `http://localhost:5173/admin` | Controlled modal dialog with fields for Title, ISBN, Category, Total Copies, and Author selector. |
| **21** | **Author Management Console** | `http://localhost:5173/admin` (Authors Tab)| Author table with bio viewer and **+ Add New Author** button. |
| **22** | **Author Referential Protection**| `http://localhost:5173/admin` | Attempting to delete author with linked books showing conflict alert: *"Cannot delete author because related books depend on it."* |
| **23** | **Reservation Oversight Table** | `http://localhost:5173/admin` (Reservations)| Ledger of all patron reservations showing patron names, titles, statuses, and **Approve** button. |
| **24** | **Circulation Desk (Issue Modal)**| `http://localhost:5173/admin` (Circulation) | Checkout modal with patron selector, book selector, reservation fulfillment selector, and Issue action. |
| **25** | **Circulation Ledger & Returns** | `http://localhost:5173/admin` (Circulation) | Active loans table showing automated 14-day due dates and one-click **Process Return** buttons. |
| **26** | **Overdue Monitoring View** | `http://localhost:5173/admin` (Circulation) | Filtered view highlighting active loans past their scheduled return due date. |

---

## Part 5: Error Handling & Technical Verifications

| # | Screen / State | URL / Viewport | What to Capture / Highlight |
|---|---|---|---|
| **27** | **404 Fallback Page** | `http://localhost:5173/unknown-path` | Custom Not Found page with friendly message and Return to Home navigation button. |
| **28** | **Nonexistent Book Fallback** | `http://localhost:5173/books/999999` | Error card: *"The requested book was not found"* with return button. |
| **29** | **API Health Response** | `http://localhost:5000/api/health` | Browser/Postman JSON output showing `HTTP 200`, `success: true`, and `database: "connected"`. |
| **30** | **MySQL Database Tables & Schema**| Terminal / MySQL Workbench | SQL CLI output of `SHOW TABLES IN library_db;` and `DESCRIBE books;`. |
| **31** | **Automated Test Results (100%)** | Terminal | Terminal output running `npm test` showing all 8 test suites passing (192+ verifications). |
| **32** | **Clean Production Build Output** | Terminal | Terminal output running `npm run build:frontend` showing Vite compilation with 0 errors. |
| **33** | **Git Commit Log (`git log`)** | Terminal | Terminal output of `git log --oneline -n 10` displaying atomic Conventional Commits across phases. |

---

## Recommended Formatting for College Report
- **Dimensions**: Crop screenshots cleanly around the browser window or terminal box (avoid taskbars and unneeded background clutter).
- **Figure Captions**: Label each screenshot clearly in the report (e.g., *Figure 4.6: Live Debounced Search Filter by Book Category*).
- **Annotations**: Use red boxes or callout arrows to guide the examiner's eye to key features (such as stock numbers, status badges, or validation alerts).
