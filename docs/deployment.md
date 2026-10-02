# Deployment Guide & Readiness Specification

This document provides complete instructions for preparing, configuring, building, and deploying the **Online Book Inventory & Reservation System** across on-premise servers, virtual private servers (VPS), or cloud hosting environments (such as Render, Railway, AWS, DigitalOcean, or Azure).

---

## 1. Prerequisites

Before deploying the application, ensure the host environment meets the following minimum requirements:

| Component | Minimum Version | Recommended Version | Purpose |
|---|---|---|---|
| **Node.js** | v18.0.0 | v20.x LTS | Backend JavaScript runtime |
| **npm** | v9.0.0 | v10.x | Package manager & script runner |
| **MySQL Server** | v8.0 | v8.0.35+ | Relational database management system |
| **Git** | v2.30+ | Latest | Source code version control |
| **Reverse Proxy** *(Optional)* | Nginx 1.20+ / Caddy | Latest | SSL termination & static file serving |

---

## 2. Architecture & Deployment Topologies

The application can be deployed using one of two primary production topologies:

### Topology A: Separated Frontend & Backend (Recommended)
- **Frontend**: Built statically with Vite (`dist/` folder) and hosted on a global CDN or static hosting platform (Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront).
- **Backend**: Node.js/Express service running behind a reverse proxy or PaaS (Render, Railway, Fly.io, AWS Elastic Beanstalk).
- **Database**: Managed MySQL instance (AWS RDS, PlanetScale, DigitalOcean Managed Database) or dedicated MySQL 8.0 server.

### Topology B: Monolithic Single-Host / VPS Deployment
- Both frontend and backend reside on a single Linux/Windows VPS.
- Express serves both API endpoints and the compiled React production bundle, or Nginx routes `/api` to Express and `/` to the Vite static files.

---

## 3. Database Deployment & Initialization

### 3.1 Create Production Database
Log into your MySQL production host with administrative privileges:
```sql
CREATE DATABASE IF NOT EXISTS `library_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3.2 Create Dedicated Application Database User
To adhere to the principle of least privilege, do not connect the application using the `root` MySQL user in production:
```sql
CREATE USER 'library_app'@'%' IDENTIFIED BY 'StrongRandomPassword123!#';
GRANT SELECT, INSERT, UPDATE, DELETE ON library_db.* TO 'library_app'@'%';
FLUSH PRIVILEGES;
```

### 3.3 Apply DDL Schema
Execute the database schema script [`database/schema.sql`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/database/schema.sql):
```bash
mysql -u library_app -p -h <db_host> library_db < database/schema.sql
```

### 3.4 Seed Baseline Administrative Data (Optional)
If bootstrapping a fresh instance with the initial author and book catalog, execute [`database/seed.sql`](file:///c:/Users/chinn/OneDrive/Desktop/FSD_PROJECT/database/seed.sql):
```bash
mysql -u library_app -p -h <db_host> library_db < database/seed.sql
```
> [!IMPORTANT]
> Immediately after seeding in a production environment, log in with the default administrator account (`admin@library.edu`) and change the password, or run a query to update it with your own securely hashed password.

---

## 4. Backend Configuration & Startup

### 4.1 Production Environment Variables (`backend/.env`)
Create `backend/.env` with production-grade values. **Never commit this file to version control.**

```ini
# Node Environment & Server Port
NODE_ENV=production
PORT=5000

# CORS Configuration
# Set to the exact deployed URL(s) of your frontend application
CLIENT_URL=https://library.yourdomain.com

# Database Connection
DB_HOST=db.yourdomain.internal
DB_PORT=3306
DB_USER=library_app
DB_PASSWORD=StrongRandomPassword123!#
DB_NAME=library_db

# JWT Security
# Generate a cryptographically secure 64-character hex string:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=c8f8b89d49e1a82f3c7e46201b1f92e094ab6c78e12d3f4581290a84e62c11ef
JWT_EXPIRES_IN=1h

# Circulation Business Logic (Loan duration in days)
BOOK_LOAN_DAYS=14
```

### 4.2 Install Production Dependencies
```bash
cd backend
npm install --omit=dev
```

### 4.3 Start Backend Service
Using Node directly:
```bash
npm start
```
Or using a production process manager like **PM2** to handle automatic restarts, clustering, and log rotation:
```bash
# Install PM2 globally
npm install -g pm2

# Start backend under PM2
pm2 start src/server.js --name "library-backend" --instances 2 --max-memory-restart 300M

# Enable startup on system boot
pm2 startup
pm2 save
```

### 4.4 Health Check Verification
Verify that the service is operational and connected to MySQL:
```bash
curl -i http://localhost:5000/api/health
```
Expected response:
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "success": true,
  "message": "Online Book Inventory & Reservation System API is running",
  "database": "connected"
}
```

---

## 5. Frontend Configuration & Production Build

### 5.1 Production Environment Variables (`frontend/.env`)
Create `frontend/.env` pointing to the public backend API endpoint:
```ini
# Public API base endpoint (Must be accessible from the user's browser)
VITE_API_BASE_URL=https://api.yourdomain.com/api
```
> [!CAUTION]
> All `VITE_*` variables are embedded into client-side JavaScript assets during the build process. Never put database credentials, server secrets, or private keys in `frontend/.env`.

### 5.2 Build Static Production Assets
```bash
cd frontend
npm install
npm run build
```
This generates the optimized, minified production assets in `frontend/dist/`:
- `dist/index.html` (Single-Page Application entry point)
- `dist/assets/index-*.css` (Optimized CSS stylesheets)
- `dist/assets/index-*.js` (Minified JavaScript bundles)

### 5.3 Serving the Frontend with Nginx (VPS Example)
```nginx
server {
    listen 80;
    server_name library.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name library.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/library.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/library.yourdomain.com/privkey.pem;

    root /var/www/library-system/frontend/dist;
    index index.html;

    # Handle client-side routing (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. CORS & Domain Configuration

In production, cross-origin resource sharing must be strictly restricted to your deployed frontend domain:

1. In `backend/.env`, set `CLIENT_URL` to match your frontend origin:
   ```ini
   CLIENT_URL=https://library.yourdomain.com
   ```
2. If staging and production frontends share the backend:
   ```ini
   CLIENT_URL=https://library.yourdomain.com,https://staging-library.yourdomain.com
   ```
3. The Express backend will automatically whitelist the allowed origins and allow credentials (JWT headers) without throwing CORS violations.

---

## 7. Security Hardening Checklist

Before public exposure, verify the following security controls:

- [ ] **No Secrets in Version Control**: Audit repository with `git status` and `git log` to ensure no `.env` files or credentials are tracked.
- [ ] **Strong JWT Secret**: Verify `JWT_SECRET` is at least 32 characters long and randomly generated.
- [ ] **Database Credentials**: Non-root database account with restricted privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- [ ] **TLS / HTTPS**: All traffic encrypted via HTTPS certificates (e.g. Let's Encrypt).
- [ ] **Error Sanitization**: Ensure backend runs with `NODE_ENV=production` so stack traces and SQL syntax errors are never returned to clients.
- [ ] **SQL Injection Protection**: All database queries use parameterized SQL prepared statements via `mysql2`.
- [ ] **Password Security**: Passwords hashed using bcrypt (10 rounds) before storage.

---

## 8. Deployment Readiness Verification Checklist

Use this checklist during staging/production verification:

- [ ] Database created with `utf8mb4` character set.
- [ ] Database schema (`schema.sql`) executed with zero errors.
- [ ] Seed data (`seed.sql`) optionally executed for baseline catalog.
- [ ] Backend environment file (`backend/.env`) configured with valid DB credentials and unique JWT secret.
- [ ] Frontend environment file (`frontend/.env`) configured with deployed API URL.
- [ ] Backend starts cleanly and logs `[SERVER] Online Book Inventory API is running`.
- [ ] Health check `GET /api/health` returns `HTTP 200` with `database: "connected"`.
- [ ] Frontend builds successfully (`npm run build`) with zero compile errors.
- [ ] User authentication flow verified (patron registration and login).
- [ ] Patron workflows verified (browse books, debounced search, reservation hold, self-cancellation).
- [ ] Admin workflows verified (author CRUD, book CRUD, reservation approval, book issue, return).
- [ ] Overdue detection verified.
- [ ] CORS policies verified from target domain.
- [ ] Process manager configured for automatic service restart.
