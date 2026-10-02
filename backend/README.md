# Backend — Online Book Inventory & Reservation System

Express.js REST API service for library inventory and reservation management.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Copy `.env.example` to `.env` and configure variables:
   ```bash
   cp .env.example .env
   ```

3. Start server:
   - Development (with auto-reload):
     ```bash
     npm run dev
     ```
   - Production:
     ```bash
     npm start
     ```

## Health Check Endpoint
* `GET /api/health`
  * Response:
    ```json
    {
      "success": true,
      "message": "Online Book Inventory & Reservation System API is running"
    }
    ```
