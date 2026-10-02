@echo off
title Online Book Inventory - Startup Launcher
setlocal EnableDelayedExpansion

echo ===============================================================================
echo            ONLINE BOOK INVENTORY ^& RESERVATION SYSTEM - LAUNCHER
echo ===============================================================================
echo.

:: 1. Verify Node.js and npm are installed and in PATH
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js (v18+) from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not found in your system PATH!
    echo Please install Node.js/npm and ensure it is added to your PATH.
    echo.
    pause
    exit /b 1
)

:: 2. Display MySQL requirement notice
echo [NOTICE] Database Requirement:
echo Make sure MySQL/XAMPP is running before starting the application.
echo Default database: library_db (port 3306).
echo.

:: Set root directory path safely
set "PROJECT_ROOT=%~dp0"

:: 3. Start Backend Server in a new dedicated Command Prompt window
echo [STARTING] Launching Backend Server on port 5000...
start "Book Inventory - Backend API (Port 5000)" cmd /k "cd /d "%PROJECT_ROOT%backend" && echo =================================================== && echo   Online Book Inventory Backend Server (Port 5000) && echo   Health check: http://localhost:5000/api/health && echo =================================================== && npm run dev"

:: Brief 2-second pause to allow backend initialization before frontend starts
timeout /t 2 /nobreak >nul

:: 4. Start Frontend Client in a new dedicated Command Prompt window
echo [STARTING] Launching Frontend Client on port 5173...
start "Book Inventory - Frontend (Port 5173)" cmd /k "cd /d "%PROJECT_ROOT%frontend" && echo =================================================== && echo   Online Book Inventory Frontend (Port 5173) && echo   Application URL: http://localhost:5173/ && echo =================================================== && npm run dev"

echo.
echo ===============================================================================
echo [SUCCESS] Both Backend and Frontend services have been launched!
echo.
echo   - Backend API:    http://localhost:5000/
echo   - Health Probe:   http://localhost:5000/api/health
echo   - Frontend App:   http://localhost:5173/
echo.
echo To stop the application:
echo   Close both the Backend and Frontend Command Prompt windows (or press Ctrl+C).
echo ===============================================================================
echo.
pause
