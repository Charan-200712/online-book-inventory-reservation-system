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

2. START OPTIONS (Choose any ONE):

   Option A - Double-Click Launcher (Recommended for Windows):
     Double-click "start-project.bat" (or "start project.bat") in this folder.
     - Automatically checks and frees ports 5000 and 5173.
     - Starts both the Backend and Frontend servers.
     - Automatically launches your default web browser to http://localhost:5173/.

   Option B - From Terminal / Command Prompt:
     Open a terminal in this root folder and type:
       npm start
     (or 'npm run dev')
     This executes the unified launcher that starts both servers and opens the browser.

   Option C - Inside VS Code:
     Press Ctrl+Shift+P -> "Tasks: Run Task" -> "Start Project (Full Stack)",
     or click "start" under the NPM SCRIPTS panel in the VS Code sidebar.

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

  - Double-click "stop-project.bat" (or "stop project.bat").
  - Or if running in terminal via 'npm start', press Ctrl + C.
===============================================================================
