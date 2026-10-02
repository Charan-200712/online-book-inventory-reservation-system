# Database Documentation — Online Book Inventory & Reservation System

## Database Overview
* **Database Name**: `library_db`
* **RDBMS**: MySQL 8.0+
* **Character Set**: `utf8mb4`
* **Collation**: `utf8mb4_unicode_ci`

---

## Entity-Relationship (ER) Overview

```text
       ┌──────────────┐
       │   authors    │
       └──────┬───────┘
              │ 1
              │
              │ N (author_id, ON DELETE SET NULL)
       ┌──────┴───────┐                ┌──────────────┐
       │    books     │ 1            1 │    users     │
       └──────┬───────┘────────┬───────└──────┬───────┘
              │ 1              │              │ 1
              │                │              │
              │ N              │              │ N
       ┌──────┴───────┐        │       ┌──────┴───────┐
       │ reservations │ 1      │       │ reservations │
       └──────┬───────┘        │       └──────────────┘
              │ 1              │
              │                │
              │ N (ON DELETE SET NULL)
       ┌──────┴────────────────┴───────┐
       │         transactions          │
       └───────────────────────────────┘
```

### Table Relationships
1. **authors (1) ───── (N) books**: An author can write multiple books. `books.author_id` references `authors.id` with `ON DELETE SET NULL` and `ON UPDATE CASCADE`. If an author record is deleted, the book records remain intact with `author_id = NULL`.
2. **users (1) ─────── (N) reservations**: A registered user can make book reservations. `reservations.user_id` references `users.id` with `ON DELETE RESTRICT` and `ON UPDATE CASCADE` to prevent accidental deletion of user audit records.
3. **books (1) ─────── (N) reservations**: Multiple reservations can be made for a book. `reservations.book_id` references `books.id` with `ON DELETE RESTRICT` and `ON UPDATE CASCADE`.
4. **users (1) ─────── (N) transactions**: A user can borrow books over time. `transactions.user_id` references `users.id` with `ON DELETE RESTRICT` and `ON UPDATE CASCADE` to safeguard historical loan records.
5. **books (1) ─────── (N) transactions**: Books can be issued across multiple loan transactions. `transactions.book_id` references `books.id` with `ON DELETE RESTRICT` and `ON UPDATE CASCADE`.
6. **reservations (1) ─ (N) transactions**: A transaction may fulfill a prior reservation. `transactions.reservation_id` references `reservations.id` with `ON DELETE SET NULL` and `ON UPDATE CASCADE`. Direct issues without reservation are supported with `reservation_id = NULL`.

---

## Tables and Data Dictionary

### 1. `users`
Stores system accounts for standard library patrons and administrators.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique user identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Full name of the user |
| `email` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Unique email for authentication |
| `password` | `VARCHAR(255)` | `NOT NULL` | Hashed password string |
| `role` | `ENUM('USER', 'ADMIN')` | `NOT NULL`, `DEFAULT 'USER'` | Authorization role |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Account registration timestamp |

### 2. `authors`
Stores bibliographic details about book authors.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique author identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Author full name |
| `biography` | `TEXT` | `NULL` | Brief biographical notes |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |

### 3. `books`
Stores the library book catalog, stock levels, and category classification.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique book identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Title of the book |
| `isbn` | `VARCHAR(20)` | `NOT NULL`, `UNIQUE` | Unique ISBN-10 or ISBN-13 |
| `author_id` | `INT` | `NULL`, `FOREIGN KEY` (authors.id) | Author foreign key |
| `category` | `VARCHAR(50)` | `NOT NULL` | Subject genre / department category |
| `total_copies` | `INT` | `NOT NULL`, `DEFAULT 1`, `CHECK (>= 0)` | Total physical copies owned |
| `available_copies`| `INT` | `NOT NULL`, `DEFAULT 1`, `CHECK (>= 0)` | Copies currently on shelf |
| `description` | `TEXT` | `NULL` | Book synopsis / summary |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Catalog entry timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` | Last modification timestamp |

### 4. `reservations`
Tracks book hold requests made by users.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique reservation identifier |
| `user_id` | `INT` | `NOT NULL`, `FOREIGN KEY` (users.id) | Requesting user |
| `book_id` | `INT` | `NOT NULL`, `FOREIGN KEY` (books.id) | Requested book |
| `reservation_date`| `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Date request was placed |
| `status` | `ENUM(...)` | `NOT NULL`, `DEFAULT 'PENDING'` | `PENDING`, `APPROVED`, `CANCELLED`, `COMPLETED` |

### 5. `transactions`
Tracks physical book issues, returns, due dates, and circulation history.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Unique transaction identifier |
| `user_id` | `INT` | `NOT NULL`, `FOREIGN KEY` (users.id) | Borrower user identifier |
| `book_id` | `INT` | `NOT NULL`, `FOREIGN KEY` (books.id) | Issued book identifier |
| `reservation_id` | `INT` | `NULL`, `FOREIGN KEY` (reservations.id) | Related reservation if fulfilled |
| `issue_date` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Book issue timestamp |
| `due_date` | `DATE` | `NOT NULL` | Scheduled return due date |
| `return_date` | `DATE` | `NULL` | Actual date returned |
| `status` | `ENUM(...)` | `NOT NULL`, `DEFAULT 'ISSUED'` | `ISSUED`, `RETURNED`, `OVERDUE` |

---

## Important Constraints & Integrity Rules

1. **Email Uniqueness**: `users.email` is defined with a `UNIQUE` index constraint to prevent duplicate user registrations.
2. **ISBN Uniqueness**: `books.isbn` is enforced as `UNIQUE` across all catalog items.
3. **Non-negative Copy Counts**:
   * `chk_total_copies`: `CHECK (total_copies >= 0)`
   * `chk_available_copies`: `CHECK (available_copies >= 0)`
4. **Availability Invariant**:
   * `chk_copies_valid`: `CHECK (available_copies <= total_copies)` ensures available inventory never exceeds total stock.
5. **Referential Integrity**:
   * Critical audit tables (`reservations`, `transactions`) enforce `ON DELETE RESTRICT` against parent `users` and `books` records to preserve audit and transaction trails.
   * `books.author_id` uses `ON DELETE SET NULL` so removing an author profile preserves all catalog books.

---

## How to Set Up and Run SQL Scripts

### 1. Prerequisites
* **RDBMS**: MySQL Server 8.0+
* **Database Name**: `library_db`
* **Default Character Set**: `utf8mb4`
* **Collation**: `utf8mb4_unicode_ci`

### 2. Running Schema Setup
To create the database, tables, relationships, constraints, and indexes, execute [`schema.sql`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/database/schema.sql):

```bash
# Using MySQL Command Line Client:
mysql -u root -p < database/schema.sql

# On Windows PowerShell:
cmd /c "mysql -u root -p < database\schema.sql"
```

### 3. Running Sample Seed Data
To populate authors, books, users, reservations, and transactions, execute [`seed.sql`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/database/seed.sql):

```bash
# Using MySQL Command Line Client:
mysql -u root -p < database/seed.sql

# On Windows PowerShell:
cmd /c "mysql -u root -p < database\seed.sql"
```

---

## Backend Connection & Environment Configuration

The Express backend connects to MySQL using `mysql2/promise` with a connection pool configured in [`backend/src/config/db.js`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/backend/src/config/db.js).

### Required Environment Variables:
| Variable | Default Value | Description |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL server host address |
| `DB_PORT` | `3306` | MySQL server port |
| `DB_USER` | `root` | Database username |
| `DB_PASSWORD` | *(empty)* | Database user password |
| `DB_NAME` | `library_db` | Target database name |

### Connection Pool Configuration:
- `connectionLimit`: 10 concurrent pooled connections
- `waitForConnections`: `true`
- `queueLimit`: 0 (unlimited queue)
- `enableKeepAlive`: `true`
- `keepAliveInitialDelay`: 0ms

### Production User Security Recommendation:
In production environments, avoid connecting using the administrative `root` user. Instead, create a dedicated application user with restricted data manipulation privileges:
```sql
CREATE USER 'library_app'@'%' IDENTIFIED BY 'StrongRandomPassword123!#';
GRANT SELECT, INSERT, UPDATE, DELETE ON library_db.* TO 'library_app'@'%';
FLUSH PRIVILEGES;
```

---

## Sample Relational Queries

### Reusable `LEFT JOIN` (Books with Authors)
Demonstrates retrieval of all books together with author information, including books without an assigned author (`author_name` is `NULL`):

```sql
SELECT
    b.id,
    b.title,
    b.isbn,
    b.total_copies,
    b.available_copies,
    a.name AS author_name
FROM books b
LEFT JOIN authors a
    ON b.author_id = a.id;
```
