# Frontend — Online Book Inventory & Reservation System

Single-page React application built with Vite, React Router, React Hooks, and Context API.

## Features

- **React Routing**: Centralized routing using React Router v6.
- **Centralized API Client**: Custom fetch-based HTTP layer in `src/services/api.js` handling `Authorization: Bearer <token>` injection, JSON serialization, and error normalization.
- **Authentication State**: Global `AuthContext` tracking user identity, token, authentication status, and session hydration from `localStorage` via `/api/auth/me`.
- **Protected Routes**: `ProtectedRoute` wrapper guarding pages against unauthenticated access and redirecting to `/login` with location preservation.
- **Controlled Forms**: `Login` and `Register` forms with client-side validation, password confirmation, disabled states, and clean error banners.
- **Catalog & Details**:
  - Book catalog with availability badge indicators and stock filtering (`/books`).
  - Book details view displaying inventory metrics and volume descriptions (`/books/:id`).
  - Authors directory (`/authors`).
- **Phase 8 Search Slot**: Prepared placeholder container on Books page for live search integration.

## Directory Structure

```text
frontend/src/
├── components/
│   ├── ErrorMessage.jsx    # Alert banner with optional retry
│   ├── Loading.jsx         # Accessible loading spinner
│   ├── Navbar.jsx          # Auth-aware top navigation & role badges
│   └── ProtectedRoute.jsx  # Route guard for authenticated pages
│
├── pages/
│   ├── Authors.jsx         # Authors directory
│   ├── BookDetails.jsx     # Single book details & metadata
│   ├── Books.jsx           # Books catalog & stock filter
│   ├── Home.jsx            # Landing hero & feature highlights
│   ├── Login.jsx           # User sign-in with controlled inputs
│   ├── NotFound.jsx        # 404 fallback page
│   └── Register.jsx        # Account registration
│
├── services/
│   ├── api.js              # Central fetch client & error handler
│   ├── authService.js      # Login, register, logout, getCurrentUser
│   ├── authorService.js    # Authors list & details API calls
│   └── bookService.js      # Book catalog & single book API calls
│
├── context/
│   └── AuthContext.jsx     # Authentication context provider & useAuth hook
│
├── App.jsx                 # App layout, providers, and route tree
├── index.css               # Clean responsive styling & design tokens
└── main.jsx                # Application root with BrowserRouter
```

## Available Routes

| Route | Access | Component | Description |
| :--- | :--- | :--- | :--- |
| `/` | Public | `Home` | System overview, hero presentation, and navigation |
| `/login` | Public | `Login` | User authentication form |
| `/register` | Public | `Register` | Member registration form |
| `/books` | Protected | `Books` | Catalog listing with availability badges and stock filter |
| `/books/:id` | Protected | `BookDetails` | Detailed book view, author, description, and copy counts |
| `/authors` | Protected | `Authors` | Authors directory with biographies |
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
