@echo off
title Online Book Inventory - Stop Servers

echo ===============================================================================
echo            ONLINE BOOK INVENTORY ^& RESERVATION SYSTEM - STOP SERVERS
echo ===============================================================================
echo.

echo Stopping any running backend and frontend processes...

:: 1. Stop any PM2 background services
call npx pm2 stop all >nul 2>nul

:: 2. Stop processes listening on port 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Stopping Backend process (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

:: 3. Stop processes listening on port 5173 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Stopping Frontend process (PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [SUCCESS] Ports 5000 and 5173 are now free.
echo.
pause
