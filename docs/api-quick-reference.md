# REST API Quick Reference Guide

This document provides a compact reference of all REST API endpoints currently implemented in the **Online Book Inventory & Reservation System**.

All endpoints are mounted under the base path: `/api`  
Protected endpoints require the HTTP header: `Authorization: Bearer <jwt_token>`

---

## 1. Health Probe

| Method | Endpoint | Authentication | Role | Purpose |
|---|---|:---:|:---:|---|
| `GET` | `/api/health` | None | Public | Returns service uptime status and MySQL database connectivity status (`200 OK` or `503 Service Unavailable`). |

---

## 2. Authentication (`/api/auth`)

| Method | Endpoint | Authentication | Role | Purpose | Request Body / Parameters |
|---|---|:---:|:---:|---|---|
| `POST` | `/api/auth/register` | None | Public | Register a new patron or administrator account. | Body: `{ name, email, password, role? }` |
| `POST` | `/api/auth/login` | None | Public | Authenticate user credentials and return signed JWT. | Body: `{ email, password }` |
| `POST` | `/api/auth/logout` | None | Public | Client-side session termination instruction. | None |
| `GET` | `/api/auth/me` | JWT | USER / ADMIN | Retrieve authenticated user profile and role details. | None |
| `GET` | `/api/auth/admin-test` | JWT | ADMIN | Verification test route for administrator role check. | None |

---

## 3. Books Catalog (`/api/books`)

| Method | Endpoint | Authentication | Role | Purpose | Query / Request Parameters |
|---|---|:---:|:---:|---|---|
| `GET` | `/api/books` | JWT | USER / ADMIN | List books with optional availability filter and pagination. | Query: `available` (`true`/`false`), `page`, `limit` |
| `GET` | `/api/books/search` | JWT | USER / ADMIN | Real-time search across Title, ISBN, Author, Category. | Query: `q` (keyword term), `available` (`true`/`false`) |
| `GET` | `/api/books/:id` | JWT | USER / ADMIN | Retrieve complete details of a single book by ID. | Param: `:id` (Integer) |
| `GET` | `/api/books/sample-left-join` | None | Public | Relational `LEFT JOIN` demonstration showing author name. | None |
| `POST` | `/api/books` | JWT | ADMIN | Create a new book entry in the catalog. | Body: `{ title, isbn, author_id, category, total_copies, available_copies, description }` |
| `PUT` | `/api/books/:id` | JWT | ADMIN | Update catalog metadata and inventory counts for a book. | Param: `:id`, Body: updated fields |
| `DELETE`| `/api/books/:id` | JWT | ADMIN | Remove a book (blocked if active holds or loans exist). | Param: `:id` |

---

## 4. Authors Registry (`/api/authors`)

| Method | Endpoint | Authentication | Role | Purpose | Query / Request Parameters |
|---|---|:---:|:---:|---|---|
| `GET` | `/api/authors` | JWT | USER / ADMIN | Retrieve complete list of all registered book authors. | None |
| `GET` | `/api/authors/:id` | JWT | USER / ADMIN | Retrieve author profile and array of linked catalog books. | Param: `:id` (Integer) |
| `POST` | `/api/authors` | JWT | ADMIN | Add a new author to the library registry. | Body: `{ name, biography }` |
| `PUT` | `/api/authors/:id` | JWT | ADMIN | Update an existing author's name or biography. | Param: `:id`, Body: `{ name, biography }` |
| `DELETE`| `/api/authors/:id` | JWT | ADMIN | Delete an author (blocked with 409 if linked to books). | Param: `:id` |

---

## 5. Reservations Desk (`/api/reservations`)

| Method | Endpoint | Authentication | Role | Purpose | Query / Request Parameters |
|---|---|:---:|:---:|---|---|
| `POST` | `/api/reservations` | JWT | USER / ADMIN | Place an atomic reservation hold (decrements shelf stock).| Body: `{ book_id }` |
| `GET` | `/api/reservations` | JWT | USER / ADMIN | Retrieve current user's own reservations. | None |
| `GET` | `/api/reservations/all` | JWT | ADMIN | Retrieve all reservation holds across all patrons. | None |
| `GET` | `/api/reservations/:id` | JWT | USER / ADMIN | View details of a specific reservation (owner or admin). | Param: `:id` |
| `PUT` | `/api/reservations/:id/approve`| JWT | ADMIN | Approve a pending hold for physical book pickup. | Param: `:id` |
| `PUT` | `/api/reservations/:id/cancel` | JWT | USER / ADMIN | Cancel hold (owner or admin; increments shelf stock). | Param: `:id` |

---

## 6. Transactions & Circulation (`/api/transactions`)

| Method | Endpoint | Authentication | Role | Purpose | Query / Request Parameters |
|---|---|:---:|:---:|---|---|
| `GET` | `/api/transactions` | JWT | USER / ADMIN | Retrieve authenticated user's personal loan history. | None |
| `GET` | `/api/transactions/all` | JWT | ADMIN | Retrieve complete circulation ledger across all patrons. | None |
| `GET` | `/api/transactions/overdue` | JWT | ADMIN | Retrieve active loans that have exceeded the 14-day limit.| None |
| `POST` | `/api/transactions/issue` | JWT | ADMIN | Check out physical book (direct or hold fulfillment). | Body: `{ user_id, book_id, reservation_id? }` |
| `POST` | `/api/transactions/:id/return`| JWT | ADMIN | Process book return (stamps return date; increments stock).| Param: `:id` |

---

## Standardized HTTP Error Status Codes

| Status Code | Meaning | Common Application Scenario |
|---|---|---|
| **200 OK** | Success | Successful retrieval, update, or return action. |
| **201 Created** | Created | Successful registration, book creation, or hold placement. |
| **400 Bad Request** | Validation Failure | Missing required fields, invalid email, or non-numeric ID parameter. |
| **401 Unauthorized** | Authentication Error | Missing, expired, or invalid JWT token in `Authorization` header. |
| **403 Forbidden** | Authorization Error | Patron attempting an administrative action or accessing another user's hold. |
| **404 Not Found** | Missing Resource | Unmapped endpoint URL or nonexistent book, author, or reservation ID. |
| **409 Conflict** | Business Conflict | Duplicate email, duplicate active hold, or deleting an entity with active dependencies. |
| **500 Internal Error**| Server Error | Unexpected database failure (sanitized; no SQL leaked). |
