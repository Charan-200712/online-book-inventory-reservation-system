===============================================================================
       ONLINE BOOK INVENTORY & RESERVATION SYSTEM - QUICK RUN GUIDE
===============================================================================

This project consists of:
  1. Backend API (Node.js/Express) running on http://localhost:5000
  2. Frontend Application (React 18 / Vite) running on http://localhost:5173
  3. Database (MySQL 8.0 / XAMPP) running on localhost:3306 (database: library_db)

-------------------------------------------------------------------------------
HOW TO START THE APPLICATION (ONE-CLICK)
-------------------------------------------------------------------------------

1. Ensure MySQL / XAMPP is running on your machine:
   - Start MySQL service (Port 3306).
   - Ensure the database 'library_db' has been initialized using:
       database/schema.sql
       database/seed.sql (for initial test accounts and books)

2. Double-click "start-project.bat" in this root project folder.

3. Two separate Command Prompt windows will automatically open:
   - Window 1: Backend API server running 'npm run dev' on port 5000
   - Window 2: Frontend Vite server running 'npm run dev' on port 5173

4. Open your web browser and navigate to:
   http://localhost:5173/

5. To check backend health status:
   http://localhost:5000/api/health

-------------------------------------------------------------------------------
DEFAULT SEEDED TEST ACCOUNTS
-------------------------------------------------------------------------------

  Administrator Account:
    Email:    admin@library.edu
    Password: Admin@123

  Student / Patron Account:
    Email:    rahul.sharma@college.edu
    Password: Student@123

-------------------------------------------------------------------------------
HOW TO STOP THE APPLICATION
-------------------------------------------------------------------------------

To stop both services:
  Simply close the two Command Prompt windows (or press Ctrl + C in each window).
===============================================================================
