@echo off
title Online Book Inventory - Startup Launcher

echo ===============================================================================
echo            ONLINE BOOK INVENTORY ^& RESERVATION SYSTEM - LAUNCHER
echo ===============================================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js version 18 or higher from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verify npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not found in your system PATH!
    echo Please ensure npm is installed and added to your system PATH.
    echo.
    pause
    exit /b 1
)

:: 3. Database Reminder Notice
echo [NOTICE] Database Requirement:
echo   Make sure MySQL / XAMPP is currently running on port 3306.
echo   Database name: library_db
echo.

:: 4. Free up ports 5000 and 5173 if lingering processes exist
echo [PREPARATION] Ensuring ports 5000 and 5173 are free...
call npx pm2 stop all >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

:: 5. Launch Backend Server in a new window
echo [1/2] Starting Backend API Server (Port 5000)...
start "Book Inventory - Backend API (Port 5000)" /D "%~dp0backend" cmd /k "title Book Inventory - Backend (Port 5000) && echo =================================================== && echo   Online Book Inventory Backend Server (Port 5000) && echo   Health check: http://localhost:5000/api/health && echo =================================================== && npm run dev"

:: Brief 2-second pause to allow backend initialization
timeout /t 2 /nobreak >nul

:: 5. Launch Frontend Server in a new window
echo [2/2] Starting Frontend Vite Server (Port 5173)...
start "Book Inventory - Frontend (Port 5173)" /D "%~dp0frontend" cmd /k "title Book Inventory - Frontend (Port 5173) && echo =================================================== && echo   Online Book Inventory Frontend (Port 5173) && echo   Application URL: http://localhost:5173/ && echo =================================================== && npm run dev"

echo.
echo ===============================================================================
echo [SUCCESS] Both servers have been launched in separate Command Prompt windows!
echo.
echo   - Frontend Application: http://localhost:5173/
echo   - Backend API Health:   http://localhost:5000/api/health
echo.
echo Default Logins:
echo   - Admin:   admin@library.edu / Admin@123
echo   - Student: rahul.sharma@college.edu / Student@123
echo.
echo To stop the application:
echo   Close both the Backend and Frontend Command Prompt windows.
echo ===============================================================================
echo.
pause
