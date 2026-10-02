# Frontend — Online Book Inventory & Reservation System

Single-page React application built with Vite, React Router, React Hooks, and Context API.

## Features

- **React Routing**: Centralized routing using React Router v6.
- **Centralized API Client**: Custom fetch-based HTTP layer in `src/services/api.js` handling `Authorization: Bearer <token>` injection, JSON serialization, and error normalization.
- **Authentication State**: Global `AuthContext` tracking user identity, token, authentication status, and session hydration from `localStorage` via `/api/auth/me`.
- **Protected Routes**: `ProtectedRoute` wrapper guarding pages against unauthenticated access and redirecting to `/login` with location preservation.
- **Controlled Forms**: `Login` and `Register` forms with client-side validation, password confirmation, disabled states, and clean error banners.
- **Live Book Search & Debounce (Phase 8)**:
  - Real-time search across Title, ISBN, Author, and Category via `GET /api/books/search?q=...`.
  - 400ms debounce interval preventing keystroke query spam.
  - Stale query protection via `AbortController` cancellation cleanup in `useEffect`.
  - One-click clear search action with immediate reset.
- **Combined Availability Filtering (Phase 8)**:
  - Controlled availability selection: All Books, Available Only (`available_copies > 0`), Unavailable Only (`available_copies = 0`).
  - Seamlessly combines search terms with stock status (e.g. `/api/books/search?q=Clean&available=true`).
- **User Dashboard & Circulation (Phase 9)**:
  - Personal member profile card and circulation overview metrics.
  - Active reservation management with self-service cancellation for eligible holds and automated copy restitution.
  - Full loan circulation history displaying issue dates, due dates, return dates, and overdue status badges.
- **Book Hold Reservations (Phase 9)**:
  - Interactive "Reserve Book" actions available on book cards (`/books`) and details page (`/books/:id`).
  - Concurrency-safe hold creation via `POST /api/reservations` with instantaneous local inventory feedback.
  - Duplicate reservation detection with friendly error banners (409 Conflict).
- **Catalog & Details**:
  - Book catalog with availability badge indicators, instant reservation buttons, and live result count feedback (`/books`).
  - Book details view displaying inventory metrics, volume descriptions, and reservation panel (`/books/:id`).
  - Authors directory (`/authors`).

## Directory Structure

```text
frontend/src/
├── components/
│   ├── BookSearch.jsx         # Controlled search bar, clear button, & availability filter
│   ├── ErrorMessage.jsx       # Alert banner with optional retry
│   ├── Loading.jsx            # Accessible loading spinner
│   ├── Navbar.jsx             # Auth-aware top navigation & role badges
│   └── ProtectedRoute.jsx     # Route guard for authenticated pages
│
├── pages/
│   ├── Authors.jsx            # Authors directory
│   ├── BookDetails.jsx        # Single book details, metadata & reservation action
│   ├── Books.jsx              # Books catalog, live search, filter & direct reserve
│   ├── Dashboard.jsx          # Member dashboard, profile, active holds & loan history
│   ├── Home.jsx               # Landing hero & feature highlights
│   ├── Login.jsx              # User sign-in with controlled inputs
│   ├── NotFound.jsx           # 404 fallback page
│   └── Register.jsx           # Account registration
│
├── services/
│   ├── api.js                 # Central fetch client & error handler
│   ├── authService.js         # Login, register, logout, getCurrentUser
│   ├── authorService.js       # Authors list & details API calls
│   ├── bookService.js         # Book catalog & search API calls
│   ├── reservationService.js  # Create, list, & cancel book reservations
│   └── transactionService.js  # Retrieve user loan circulation history
│
├── context/
│   └── AuthContext.jsx        # Authentication context provider & useAuth hook
│
├── App.jsx                    # App layout, providers, and route tree
├── index.css                  # Clean responsive styling & design tokens
└── main.jsx                   # Application root with BrowserRouter
```

## Available Routes

| Route | Access | Component | Description |
| :--- | :--- | :--- | :--- |
| `/` | Public | `Home` | System overview, hero presentation, and navigation |
| `/login` | Public | `Login` | User authentication form |
| `/register` | Public | `Register` | Member registration form |
| `/books` | Protected | `Books` | Catalog listing with live search, stock filter, & hold reservations |
| `/books/:id` | Protected | `BookDetails` | Detailed book view, author, description, & hold reservation |
| `/authors` | Protected | `Authors` | Authors directory with biographies |
| `/dashboard` | Protected | `Dashboard` | Member profile, active reservations, cancellation, & loan history |
| `/404` or `*` | Public | `NotFound` | Friendly 404 page |

## Environment Configuration

Create a `.env` file in the `frontend/` directory (see `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Running the Application

### 1. Development Mode
```bash
cd frontend
npm install
npm run dev
```
Default local URL: `http://localhost:5173`

### 2. Integration Tests
```bash
npm test
```

### 3. Production Build
```bash
npm run build
```
Production build assets are compiled into `frontend/dist/`.
