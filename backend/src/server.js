const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Test MySQL connection pool during startup
  try {
    const dbTest = await db.testConnection();
    console.log(`[DATABASE] ${dbTest.message}`);
  } catch (error) {
    console.error(`[DATABASE] Database connection warning: ${error.message}`);
    console.error('[DATABASE] Verify MySQL is running and .env credentials are correct.');
  }

  // Start Express HTTP Server with resilient port retry logic
  let retries = 0;
  const maxRetries = 5;

  function listen() {
    const server = app.listen(PORT, () => {
      console.log(`[SERVER] Online Book Inventory API is running on port ${PORT}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        if (retries < maxRetries) {
          retries++;
          console.warn(`[SERVER] Port ${PORT} is busy, retrying in 1s (${retries}/${maxRetries})...`);
          setTimeout(listen, 1000);
        } else {
          console.error(`\n[ERROR] Port ${PORT} is already in use by another process.`);
          console.error(`Please close any existing terminal running on port ${PORT} and try again.\n`);
          process.exit(1);
        }
      } else {
        console.error('[SERVER] Server error:', err.message);
      }
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n[SERVER] Shutting down gracefully...');
      server.close(async () => {
        try {
          await db.end();
          console.log('[DATABASE] MySQL connection pool closed.');
        } catch (err) {
          console.error('[DATABASE] Error closing pool:', err.message);
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  listen();
}

startServer();
