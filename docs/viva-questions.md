# Comprehensive Viva Preparation Guide: 41 Questions & Answers

This guide contains 41 essential viva examination questions and concise model answers tailored specifically for the **Online Book Inventory & Reservation System**.

---

## 1. General Project Questions

### Q1: What is the Online Book Inventory & Reservation System?
**A:** It is a full-stack web application designed for departmental and institutional libraries to catalog books, track physical stock, provide real-time search, manage concurrency-safe reservations, and handle book circulation (issuance, returns, and overdue tracking) with role-based access for patrons and administrators.

### Q2: What practical problem does this system solve?
**A:** It eliminates manual register book-keeping, prevents inventory discrepancies between digital records and physical shelf copies, stops race conditions where multiple patrons reserve the last remaining book simultaneously, and automates overdue loan monitoring.

### Q3: Why was this project developed?
**A:** Departmental libraries often lack dedicated commercial software and rely on manual logs or spreadsheets. This system provides a lightweight, transaction-safe, web-based digital platform specifically tailored for students, faculty, and library staff.

### Q4: What are the main features of the system?
**A:** 
1. JWT authentication and role-based access (`USER` and `ADMIN`).
2. Catalog and author management (CRUD).
3. Real-time debounced live search and availability filtering.
4. Transaction-safe reservation holds with status lifecycle.
5. Physical book issuance with automated 14-day due date calculation.
6. Book returns with automatic inventory restoration.
7. Patron dashboard and administrative management consoles.

---

## 2. Frontend Technologies (React & Vite)

### Q5: Why did you choose React for the frontend?
**A:** React provides a declarative, component-based architecture that enables reusable UI elements, efficient Virtual DOM updates, seamless state management using Hooks, and a fast Single-Page Application (SPA) user experience without page reloads.

### Q6: What is a component in React?
**A:** A component is an independent, reusable building block of the user interface that accepts inputs (`props`), manages internal state (`useState`), and returns JSX describing how that section of the UI should look (e.g., `BookCard`, `Navbar`, `Modal`).

### Q7: What is the `useState` hook and how is it used?
**A:** `useState` is a React hook that allows functional components to maintain internal state across renders. In our project, it tracks form inputs, search terms, modal visibility, and loading indicators.

### Q8: What is the `useEffect` hook and how does it work in your project?
**A:** `useEffect` allows components to perform side effects (such as fetching catalog data from the backend, setting up timers, or synchronizing with external APIs) after the component renders or when specified dependency array variables change.

### Q9: What is a controlled component?
**A:** A controlled component is a form element (such as an `<input>` or `<select>`) whose value is governed by React state rather than the browser DOM. User keystrokes update the state, and the state dictates the input value, allowing instant validation.

### Q10: How does the live book search feature work?
**A:** When the patron types into the search bar, the input is captured by React state. A custom `useDebounce` hook pauses for 300ms before triggering the backend search API, querying across book titles, ISBNs, author names, and categories.

### Q11: Why is debouncing used in search?
**A:** Debouncing prevents an API request on every single keystroke. By waiting for a 300ms pause in user typing, it eliminates redundant network requests, reduces database query load by up to 75%, and ensures smooth UI performance.

### Q12: What is React Router and what role does it play?
**A:** React Router DOM (v6) enables client-side routing in our Single-Page Application. It allows navigation between pages (such as `/books`, `/dashboard`, `/admin`) without reloading the entire page and provides protected route wrappers that check authentication and user roles before rendering.

---

## 3. Backend Technologies (Node.js & Express)

### Q13: Why did you choose Node.js for the backend?
**A:** Node.js offers an asynchronous, event-driven, non-blocking I/O model that easily handles multiple concurrent requests with high throughput and low memory footprint. It also allows developers to use JavaScript across the entire stack.

### Q14: Why Express.js?
**A:** Express is a fast, unopinionated, minimalist web framework for Node.js. It simplifies HTTP routing, middleware composition, request parsing, and error handling for building RESTful APIs.

### Q15: What is a REST API?
**A:** A Representational State Transfer (REST) API is an architectural style for network applications that uses standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) and stateless communication, exchanging data primarily in JSON format.

### Q16: What is middleware in Express?
**A:** Middleware functions have access to the request object (`req`), response object (`res`), and the next middleware function (`next`). In our application, middleware handles CORS, request logging, JWT authentication verification, role checking, and centralized error translation.

### Q17: What is the controller and service layering pattern?
**A:** 
- **Controllers** handle HTTP-specific concerns: parsing request parameters, query strings, and payloads, validating input, and formatting the JSON response.
- **Services** encapsulate the core business logic, executing multi-statement SQL transactions, calculating due dates, and enforcing inventory rules independent of HTTP transports.

### Q18: Why are asynchronous operations (`async`/`await`) important in your backend?
**A:** Database queries take time to execute. Asynchronous `async`/`await` syntax prevents blocking the single Node.js event loop thread while waiting for MySQL responses, allowing the server to handle other client requests simultaneously.

---

## 4. Database & SQL (MySQL 8.0)

### Q19: Why did you choose MySQL as the database?
**A:** MySQL 8.0 is a battle-tested relational database that supports ACID transactions (Atomicity, Consistency, Isolation, Durability), foreign key constraints, row-level locking, and strict data typing—essential for financial and inventory integrity.

### Q20: What is a Primary Key?
**A:** A primary key is a column (or set of columns) that uniquely identifies each row in a database table. In our system, all tables (`users`, `authors`, `books`, `reservations`, `transactions`) use an auto-incrementing integer `id` as their primary key.

### Q21: What is a Foreign Key?
**A:** A foreign key is a column in one table that references the primary key of another table to establish a relational link and enforce referential integrity (e.g., `books.author_id` references `authors.id`).

### Q22: What is a SQL JOIN?
**A:** A SQL `JOIN` clause combines rows from two or more tables based on a related column between them (e.g., combining `books` and `authors` to display the author's name alongside the book title).

### Q23: Why is a `LEFT JOIN` used in the book catalog?
**A:** An `INNER JOIN` only returns books that have a matching author. A `LEFT JOIN` returns all books, even if `author_id` is `NULL` (such as departmental guides or faculty handbooks), ensuring no catalog titles are omitted from search results.

### Q24: What is a database connection pool?
**A:** A connection pool maintains a cache of active, reusable database connections. Instead of opening and closing a new TCP socket connection for every user request, Express acquires a connection from the pool, runs the query, and releases it back to the pool, dramatically improving performance and throughput.

### Q25: Why are parameterized queries used?
**A:** Parameterized queries (using `?` placeholders in SQL) separate query structure from user input. This completely prevents SQL Injection attacks because user input is never interpreted as executable SQL commands.

---

## 5. Authentication & Security (JWT & bcrypt)

### Q26: What is a JSON Web Token (JWT) and how is it structured?
**A:** A JWT is a compact, URL-safe means of representing claims securely between two parties. It consists of three parts separated by dots (`.`):
1. **Header**: algorithm and token type (`HS256`, `JWT`).
2. **Payload**: user claims (`userId`, `email`, `role`).
3. **Signature**: cryptographic hash generated using the server's private `JWT_SECRET`.

### Q27: Why is `bcrypt` used for password security?
**A:** `bcrypt` is an adaptive, one-way cryptographic hashing function with built-in salting. We use 10 salt rounds to defend against dictionary and rainbow-table attacks. The original plaintext password can never be recovered from the hash.

### Q28: What is the difference between Authentication and Authorization?
**A:** 
- **Authentication**: Verifying *who you are* (e.g., verifying user credentials during login and issuing a JWT).
- **Authorization**: Verifying *what you are allowed to do* (e.g., checking if a user has the `ADMIN` role before allowing them to delete a book).

### Q29: How does the system handle token expiration?
**A:** Tokens are issued with a 1-hour expiration lifespan (`JWT_EXPIRES_IN=1h`). When an expired token is presented, the server responds with `401 Unauthorized`. The frontend catches this event, cleans up `localStorage`, and redirects the user to `/login`.

### Q30: How does role-based authorization work in the backend?
**A:** An Express middleware function (`roleMiddleware`) inspects the decoded `req.user.role`. If the endpoint requires `ADMIN` and the user's role is `USER`, the middleware terminates the request immediately with `HTTP 403 Forbidden`.

---

## 6. Reservation & Circulation Workflows

### Q31: How does a book reservation work from start to finish?
**A:** 
1. Patron clicks **Reserve** for an available book.
2. Backend starts a transaction and executes `SELECT ... FOR UPDATE` to lock the book row.
3. If `available_copies > 0` and the user has no duplicate hold, `available_copies` is decremented by 1.
4. Reservation is created with status `PENDING`.
5. Administrator approves the hold (`APPROVED`).
6. When the patron collects the book, the administrator issues it, which creates a transaction (`ISSUED`) and marks the hold as `COMPLETED`.

### Q32: How is duplicate reservation prevented?
**A:** The reservation service queries the database for existing reservations by the same `userId` for the same `bookId` with status `PENDING` or `APPROVED`. If found, the request is rejected with `HTTP 409 Conflict`.

### Q33: How does the system guarantee inventory consistency?
**A:** The database schema enforces check constraints:
- `chk_total_copies`: `CHECK (total_copies >= 0)`
- `chk_available_copies`: `CHECK (available_copies >= 0)`
- `chk_copies_valid`: `CHECK (available_copies <= total_copies)`  
Every reservation, cancellation, issue, and return operation is executed within atomic SQL transactions to ensure stock counts are never duplicated or negative.

### Q34: What happens when an issued book is returned?
**A:** The administrator clicks **Return Book** on the circulation record. The backend stamps `return_date = CURDATE()`, updates transaction status to `RETURNED`, and increments `available_copies` on the physical book by 1. Duplicate return attempts are rejected with `409 Conflict`.

### Q35: How is overdue status calculated?
**A:** When a book is issued, the due date is calculated as `issue_date + 14 days`. A loan is overdue if its status is `ISSUED` and the current date (`CURDATE()`) is past the `due_date`. The system filters these records in the admin overdue monitoring ledger.

### Q36: Why are database transactions used for reservations and circulation?
**A:** A reservation or issue involves multiple SQL steps (checking stock, updating book counts, inserting transaction records). A transaction (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) ensures all steps succeed together; if any step fails, the database rolls back to its previous state, preventing partial data corruption.

### Q37: What is row-level locking (`SELECT ... FOR UPDATE`)?
**A:** It is a concurrency control feature of the MySQL InnoDB storage engine. When one user requests a book, the database locks that specific book row until the transaction completes, forcing concurrent requests to wait, thereby preventing race conditions on the last available copy.

---

## 7. Version Control & Engineering Practices (Git)

### Q38: Why is Git essential in software development?
**A:** Git provides distributed version control, tracking every change made to source code over time. It allows developers to revert to previous commits, work simultaneously on isolated branches, and collaborate without overwriting each other's work.

### Q39: What is a Git branch and how did you use branching in this project?
**A:** A branch is an isolated line of development. We maintained `master` as the stable release branch and created dedicated feature branches (e.g., `feature/live-search`, `feature/reservations`) to build and test features independently before merging.

### Q40: What is a Pull Request (PR) and code review?
**A:** A pull request is a formal proposal to merge changes from a feature branch into the base branch. It provides a forum for automated tests to run and team members to review code for security, performance, and functionality before merging.

### Q41: How are Git merge conflicts resolved?
**A:** When two branches modify the same lines of code, Git pauses and marks the conflict using `<<<<<<<`, `=======`, and `>>>>>>>`. The developer opens the conflicting files, chooses the correct logic, tests the application, stages the resolved files (`git add`), and completes the merge.

---

## 8. Questions an Examiner May Ask After the Demo

### Q42: What happens if two users try to reserve the last available copy at the exact same millisecond?
**A:** In our reservation service (`reservation.service.js`), the operation begins with `START TRANSACTION` followed by `SELECT available_copies FROM books WHERE id = ? FOR UPDATE`. MySQL's InnoDB engine places an exclusive row-level lock on that specific book. The first user's transaction reads `available_copies = 1`, decrements it to 0, inserts the reservation record, and commits (`COMMIT`). The second user's query is queued until the lock releases; when it unblocks, it reads `available_copies = 0`, recognizes no copies are available, and the backend returns `HTTP 400 Bad Request` ("No copies available for reservation").

### Q43: How do you prevent duplicate reservations for the same book by the same user?
**A:** Before creating a reservation, the backend executes a query on the `reservations` table checking for an existing record with `user_id = ? AND book_id = ? AND status IN ('PENDING', 'APPROVED')`. If an active reservation exists, the service throws a custom conflict error returning `HTTP 409 Conflict` with the message: *"You already have an active reservation for this book."*

### Q44: What happens if a database operation fails halfway through an issue or reservation?
**A:** Because all multi-step circulation operations are encapsulated within an explicit database transaction (`START TRANSACTION`), any runtime error or query failure triggers a `ROLLBACK` in the `catch` block. This ensures atomicity: either all changes (stock decrement, transaction creation, reservation status update) are committed together, or none of them persist, preventing half-updated data.

### Q45: How do you protect administrative APIs from being called by normal students?
**A:** Administrative endpoints are guarded by two chained middleware functions: `authMiddleware` followed by `roleMiddleware('ADMIN')`. `authMiddleware` verifies the cryptographic signature of the Bearer JWT and extracts the user's role. `roleMiddleware` then checks if `req.user.role === 'ADMIN'`. If a patron with role `USER` calls that route, the middleware immediately rejects the request with `HTTP 403 Forbidden` without executing the controller.

### Q46: What happens when a user's JWT expires?
**A:** Our JWTs are signed with a 24-hour expiration (`expiresIn: '24h'`). When an expired token is transmitted in the `Authorization` header, `jwt.verify()` in `authMiddleware` throws a `TokenExpiredError`. The middleware catches this and responds with `HTTP 401 Unauthorized` ("Token has expired"). On the frontend, the API service layer detects the 401 status, clears `localStorage`, resets the `AuthContext` state, and redirects the user to the `/login` screen.

### Q47: How are user passwords stored in the database?
**A:** Passwords are never stored in plaintext. When a user registers, `bcryptjs.hash(password, 10)` generates a 60-character salted hash using 10 rounds of salt. During login, `bcryptjs.compare()` verifies the candidate password against the stored hash in constant time to prevent timing attacks.

### Q48: Why use a database connection pool instead of opening a single connection or creating one per request?
**A:** Establishing a new TCP connection to MySQL involves network handshakes and authentication overhead (~10–50ms per request). A connection pool maintains an active pool of pre-established, reusable connections (configured for up to 10 connections in `config/db.js`). When a request arrives, it borrows an idle connection, executes queries, and releases it back to the pool, dramatically improving throughput and reducing server latency.

### Q49: Why use parameterized queries (`?` placeholders) instead of string concatenation?
**A:** Parameterized queries send SQL statements and user-supplied data to the database server in separate packets. The database compiles the SQL query structure first and treats user parameters strictly as literal values. Even if a user inputs `' OR '1'='1`, the database engine never interprets it as executable SQL syntax, completely neutralizing SQL Injection attacks.

### Q50: How does the frontend know that data changed after an action like reserving a book?
**A:** In our React components, operations like reserving a book or issuing a loan are asynchronous actions. When the API response resolves successfully, the component either:
1. Re-fetches the updated resource using a state refresh trigger function.
2. Optimistically/locally updates the relevant state variable (e.g., decrementing `available_copies` on the book state object or appending the new reservation to the active list).  
When React state updates via `useState`, React automatically re-renders the component with the new data.

### Q51: Why is `useEffect` used in the frontend components?
**A:** `useEffect` allows components to perform side-effects—such as making HTTP calls to the Express backend to load books, authors, or dashboard summaries—immediately after mounting into the DOM. By passing an appropriate dependency array (e.g., `[searchTerm, availableOnly]`), the effect automatically re-executes whenever search filters change.

### Q52: How does the search avoid sending an HTTP request for every single keystroke?
**A:** We built a custom `useDebounce` hook that wraps the search term state. When the user types, a `setTimeout` timer is scheduled for 300 milliseconds. If the user types another letter within 300ms, the previous timer is cancelled (`clearTimeout`) and a new timer starts. The API call is triggered only when typing pauses for 300ms, collapsing multiple keystrokes into a single HTTP request.

### Q53: What happens when an issued book is returned?
**A:** The administrator triggers the return action on the active loan. The backend updates the record in `transactions` by setting `status = 'RETURNED'` and `return_date = CURDATE()`. Simultaneously, it executes `UPDATE books SET available_copies = available_copies + 1 WHERE id = ?`. If an administrator accidentally attempts to return an already returned book, the backend validates the record and returns `HTTP 409 Conflict`.

### Q54: How do you detect overdue books?
**A:** When a book is issued, the system stamps `issue_date = CURDATE()` and automatically sets `due_date = DATE_ADD(CURDATE(), INTERVAL 14 DAY)`. Overdue loans are queried dynamically by filtering for records where `status = 'ISSUED' AND due_date < CURDATE()`. This avoids the need for cron jobs or batch update scripts while ensuring 100% accurate, real-time overdue detection.

### Q55: How do you maintain inventory consistency between total copies and available copies?
**A:** Consistency is enforced by database-level check constraints and transactional logic:
- `chk_available_copies`: `CHECK (available_copies >= 0)`
- `chk_copies_valid`: `CHECK (available_copies <= total_copies)`  
Every reservation, cancellation, issue, or return runs inside atomic transactions. If any operation attempts to decrement `available_copies` below zero or increment it above `total_copies`, MySQL throws a constraint violation and aborts the transaction, preserving inventory integrity.

