const db = require('../src/config/db');

async function verifyDatabase() {
  console.log('=== STEP 2: DATABASE VERIFICATION ===');
  try {
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Detected Tables:', tableNames);

    const expectedTables = ['users', 'authors', 'books', 'reservations', 'transactions'];
    const missing = expectedTables.filter(t => !tableNames.includes(t));
    if (missing.length > 0) {
      console.error('FAIL: Missing tables:', missing);
      process.exit(1);
    }
    console.log('All 5 core tables present: PASS');

    for (const table of expectedTables) {
      const [[{ count }]] = await db.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      console.log(`Table \`${table}\`: ${count} rows`);
    }

    // Verify columns and constraints on books
    const [bookCols] = await db.query('DESCRIBE books');
    console.log('Books Columns:', bookCols.map(c => c.Field));
    const [bookCopies] = await db.query('SELECT MIN(available_copies) as min_avail, MAX(available_copies) as max_avail, MIN(total_copies) as min_total FROM books');
    console.log('Books Inventory bounds:', bookCopies[0]);

    if (bookCopies[0].min_avail < 0) {
      console.error('FAIL: Found negative available_copies in books!');
    } else {
      console.log('Invariant available_copies >= 0: PASS');
    }

    const [invalidCopies] = await db.query('SELECT id, title, total_copies, available_copies FROM books WHERE available_copies > total_copies');
    if (invalidCopies.length > 0) {
      console.error('FAIL: Found available_copies > total_copies in books:', invalidCopies);
    } else {
      console.log('Invariant available_copies <= total_copies: PASS');
    }

    // Verify user roles
    const [roles] = await db.query('SELECT DISTINCT role FROM users');
    console.log('User roles in users table:', roles.map(r => r.role));

    // Verify reservation statuses
    const [resStatuses] = await db.query('SELECT DISTINCT status FROM reservations');
    console.log('Reservation statuses in DB:', resStatuses.map(r => r.status));

    // Verify transaction statuses
    const [transStatuses] = await db.query('SELECT DISTINCT status FROM transactions');
    console.log('Transaction statuses in DB:', transStatuses.map(t => t.status));

    console.log('=== DATABASE VERIFICATION COMPLETED SUCCESSFULLY ===');
    await db.end();
  } catch (err) {
    console.error('Database Verification Error:', err);
    process.exit(1);
  }
}

verifyDatabase();
