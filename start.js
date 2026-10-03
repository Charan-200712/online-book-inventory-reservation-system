/**
 * Online Book Inventory & Reservation System - Unified Launcher
 * Starts both Backend (Port 5000) and Frontend (Port 5173),
 * checks MySQL status, and automatically opens the browser.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const net = require('net');
const http = require('http');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

console.log('===============================================================================');
console.log('       ONLINE BOOK INVENTORY & RESERVATION SYSTEM - LAUNCHER');
console.log('===============================================================================');

// 1. Check if MySQL is running on port 3306
function checkMySQL(callback) {
  const socket = new net.Socket();
  socket.setTimeout(1500);

  socket.on('connect', () => {
    socket.destroy();
    console.log('[DATABASE] MySQL is running on port 3306: OK');
    callback(true);
  });

  socket.on('error', () => {
    socket.destroy();
    console.log('[WARNING] MySQL does NOT appear to be running on port 3306!');
    console.log('          Please make sure MySQL or XAMPP is started so database queries succeed.');
    callback(false);
  });

  socket.on('timeout', () => {
    socket.destroy();
    console.log('[WARNING] MySQL connection timed out on port 3306.');
    callback(false);
  });

  socket.connect(3306, '127.0.0.1');
}

// 2. Terminate any existing processes holding ports 5000 and 5173
function freePorts() {
  console.log('[PREPARATION] Checking and freeing ports 5000 and 5173...');
  const isWindows = process.platform === 'win32';
  if (!isWindows) return;

  [5000, 5173].forEach((port) => {
    try {
      const output = execSync(`netstat -aon | findstr :${port} | findstr LISTENING`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      const lines = output.trim().split('\n');
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && parseInt(pid, 10) > 0) {
          try {
            execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
            console.log(`[CLEANUP] Freed port ${port} (terminated process tree ${pid}).`);
          } catch (_) {}
        }
      });
    } catch (_) {
      // Port is already free
    }
  });
}

// 3. Open browser utility
function openBrowser(url) {
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const startCmd = isWindows ? `start "" "${url}"` : isMac ? `open "${url}"` : `xdg-open "${url}"`;
  try {
    const { exec } = require('child_process');
    exec(startCmd);
    console.log(`[BROWSER] Opened ${url} in your default browser.`);
  } catch (err) {
    console.log(`[BROWSER] Please open ${url} in your browser.`);
  }
}

// 4. Poll until Frontend Vite is ready, then open browser
function waitForFrontendAndOpen(url, maxRetries = 15) {
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    const req = http.get(url, (res) => {
      clearInterval(interval);
      openBrowser(url);
    });
    req.on('error', () => {
      if (attempts >= maxRetries) {
        clearInterval(interval);
        openBrowser(url);
      }
    });
    req.setTimeout(1000, () => req.destroy());
  }, 1000);
}

// 5. Main launch function
function launch() {
  freePorts();

  console.log('[1/2] Starting Backend API Server (Port 5000)...');
  const backendProcess = spawn('npm run dev', {
    cwd: BACKEND_DIR,
    shell: true,
    stdio: 'inherit'
  });

  console.log('[2/2] Starting Frontend Vite Server (Port 5173)...');
  const frontendProcess = spawn('npm run dev', {
    cwd: FRONTEND_DIR,
    shell: true,
    stdio: 'inherit'
  });

  console.log('\n===============================================================================');
  console.log('[READY] Application is starting up!');
  console.log('  - Frontend Application: http://localhost:5173/');
  console.log('  - Backend API Health:   http://localhost:5000/api/health');
  console.log('  - Press Ctrl + C to stop all servers.');
  console.log('===============================================================================\n');

  // Automatically open browser once frontend responds
  waitForFrontendAndOpen('http://localhost:5173/');

  // Cleanup on exit
  function cleanup() {
    console.log('\n[STOP] Shutting down Backend and Frontend servers...');
    try {
      if (process.platform === 'win32') {
        if (backendProcess.pid) execSync(`taskkill /F /T /PID ${backendProcess.pid}`, { stdio: 'ignore' });
        if (frontendProcess.pid) execSync(`taskkill /F /T /PID ${frontendProcess.pid}`, { stdio: 'ignore' });
      } else {
        backendProcess.kill('SIGTERM');
        frontendProcess.kill('SIGTERM');
      }
    } catch (_) {}
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// Run launch sequence
checkMySQL(() => {
  launch();
});
