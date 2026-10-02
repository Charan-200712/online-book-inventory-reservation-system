# Viva Examination Quick Revision Sheet

**Project:** Online Book Inventory & Reservation System  
**Format:** One-Page Rapid Revision Guide  
**Answer Guideline:** Concise 1 to 3 sentence answers for immediate viva recall.

---

### 1. Core Architectural Concepts

#### Q1: Why React?
**Answer:** React uses a declarative, component-based architecture and a Virtual DOM to efficiently update and render user interfaces. It enables building responsive Single-Page Applications (SPAs) where components manage their own state without full-page reloads.

#### Q2: Why Node.js?
**Answer:** Node.js executes JavaScript on the server using Google Chrome's V8 engine with an asynchronous, event-driven, non-blocking I/O model. This allows our backend to handle multiple concurrent client requests with minimal system overhead.

#### Q3: Why Express?
**Answer:** Express is a minimal and flexible Node.js web application framework that provides robust routing, middleware pipelines, and HTTP utility methods. It simplifies organizing RESTful API endpoints and handling errors systematically.

#### Q4: Why MySQL?
**Answer:** MySQL is an ACID-compliant relational database management system that strictly enforces data integrity, foreign key constraints, and check invariants. Its InnoDB engine provides row-level locking (`SELECT ... FOR UPDATE`), which prevents race conditions during book reservations.

#### Q5: What is a REST API?
**Answer:** Representational State Transfer (REST) is an architectural style for networked systems that uses standard HTTP verbs (GET, POST, PUT, DELETE) and stateless client-server interactions. In our project, all API endpoints exchange structured JSON payloads.

---

### 2. Security, Authentication & Sessions

#### Q6: What is JWT (JSON Web Token)?
**Answer:** JWT is a compact, URL-safe means of representing claims securely between two parties as an encrypted or cryptographically signed string. In our system, the server issues a signed token containing user ID and role upon login, which the client transmits in the `Authorization: Bearer <token>` header for stateless session validation.

#### Q7: Why bcrypt (bcryptjs)?
**Answer:** bcrypt is a cryptographic, one-way adaptive hashing algorithm that incorporates random salt and configurable work factor (cost) to protect passwords. It prevents rainbow table attacks and guarantees that plain-text passwords are never stored or recoverable from the database.

#### Q8: What is the difference between Authentication and Authorization?
**Answer:** Authentication verifies the identity of a user ("Who are you?" via login credentials and JWT verification). Authorization verifies whether an authenticated user has the necessary permissions to perform a specific action ("What are you allowed to do?" such as restricting book creation to `ADMIN` users).

#### Q9: What is middleware in Express?
**Answer:** Middleware functions are functions that have access to the request object (`req`), response object (`res`), and the `next` function in the application's request-response cycle. They can execute code, modify `req`/`res`, end the request, or call `next()` to pass control to the subsequent handler (e.g., verifying JWTs or checking user roles).

---

### 3. Database & Concurrency Controls

#### Q10: What is a database connection pool?
**Answer:** A connection pool is a cache of database connections maintained by the server so that connections can be reused for subsequent requests rather than opening and closing a new connection every time. Our backend uses `mysql2.createPool` with up to 10 reusable connections for optimal performance.

#### Q11: What is a SQL JOIN?
**Answer:** A SQL JOIN clause combines rows from two or more tables based on a related column between them. It allows queries to aggregate relational data across multiple entities in a single atomic database query.

#### Q12: Why use a LEFT JOIN for books and authors?
**Answer:** A `LEFT JOIN` returns all records from the left table (`books`) and matched records from the right table (`authors`). If an author record is absent or unlinked, the book is still returned with `NULL` for author fields rather than being completely omitted from search results.

#### Q13: What is a database transaction?
**Answer:** A transaction is a sequence of SQL operations executed as a single logical unit of work satisfying ACID properties (Atomicity, Consistency, Isolation, Durability). Either all operations succeed and are committed (`COMMIT`), or if any operation fails, all changes are undone (`ROLLBACK`).

#### Q14: Why are database transactions necessary in this project?
**Answer:** Operations like reserving, issuing, or returning a book require multiple updates (checking available stock, updating book counts, and writing audit records). A database transaction ensures that if an error occurs mid-way, the entire operation is rolled back, preventing corrupted stock counts.

#### Q15: How is inventory protected from becoming negative?
**Answer:** Inventory safety is enforced at both the application and database tiers. The MySQL schema defines check constraints `CHECK (available_copies >= 0)` and `CHECK (available_copies <= total_copies)`, while the service layer applies InnoDB row-level locking (`SELECT ... FOR UPDATE`) during transactions.

#### Q16: How does the reservation system work?
**Answer:** An authenticated patron clicks reserve on a book with available copies. The backend checks for duplicate active reservations, locks the book row in an atomic transaction, decrements `available_copies`, and inserts a reservation record with status `PENDING`, which an administrator can approve or fulfill upon book issuance.

---

### 4. React Frontend Architecture

#### Q17: What is the `useEffect` hook?
**Answer:** `useEffect` is a React hook that enables functional components to perform side effects, such as fetching data from backend APIs or subscribing to events, after the component renders or when dependencies in its dependency array change.

#### Q18: What is a controlled component?
**Answer:** A controlled component is an input element whose value is controlled directly by React state via `value` and `onChange` props. This gives the component immediate control over user inputs, enabling real-time validation and consistent state synchronization.

#### Q19: Why is debouncing used in search?
**Answer:** Debouncing delays the execution of a function until a certain amount of time has elapsed since the last time it was invoked. In our search bar, a 300ms debounce prevents sending an API request on every keystroke, dramatically reducing unnecessary network traffic and database queries.

---

### 5. Version Control & Engineering Practices

#### Q20: What is Git?
**Answer:** Git is a distributed version control system that tracks changes in source code across the software development lifecycle. It enables branching, reverting, history auditing, and collaborative code integration.

#### Q21: What is a Pull Request (PR)?
**Answer:** A pull request is a mechanism in version control platforms where a developer asks teammates to review and merge changes from a feature branch into the main branch. It provides an automated gate for running tests and verifying code quality before deployment.

---
