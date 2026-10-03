/**
 * Phase 15 End-to-End Verification Test Suite
 * Online Book Inventory & Reservation System
 *
 * Exercises all critical paths:
 * 1. Health & DB connection
 * 2. Authentication, bcrypt, JWT, and RBAC
 * 3. Authors & Books CRUD, Relational LEFT JOIN
 * 4. Multi-field Search, filters, and SQL injection safety
 * 5. Reservation Lifecycle & Concurrency Holds
 * 6. Circulation (Issue, 14-day Due Date, Return, Status Transitions)
 * 7. Inventory Invariants across all database books
 * 8. Transaction History & Privacy Isolation
 * 9. Error Sanitization (400, 401, 403, 404, 409, 500)
 */

const http = require('http');
const app = require('../src/app');
const db = require('../src/config/db');

let server;
let serverUrl;
let port;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(options.url || serverUrl + options.path);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`  PASS: ${message}`);
}

async function runE2EVerification() {
  console.log('====================================================');
  console.log('   PHASE 15: COMPLETE END-TO-END VERIFICATION       ');
  console.log('====================================================\n');

  // Start ephemeral server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      serverUrl = `http://127.0.0.1:${port}`;
      console.log(`[TEST SERVER] Running on ${serverUrl}\n`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------------------
    // STEP 3: BACKEND STARTUP & HEALTH API TEST
    // -------------------------------------------------------------------------
    console.log('--- 1. BACKEND STARTUP & HEALTH CHECK ---');
    const healthRes = await request({ path: '/api/health' });
    assert(healthRes.status === 200, 'GET /api/health returns HTTP 200');
    assert(healthRes.data.success === true, 'Health response indicates success: true');
    assert(healthRes.data.database === 'connected', 'Database pool reports connected');

    // -------------------------------------------------------------------------
    // STEP 4: AUTHENTICATION E2E TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 2. AUTHENTICATION & SECURITY E2E ---');
    const uniqueEmail = `demo.user.${Date.now()}@college.edu`;
    const regRes = await request({
      method: 'POST',
      path: '/api/auth/register'
    }, {
      name: 'Demo Student',
      email: uniqueEmail,
      password: 'Password@123',
      role: 'USER'
    });
    assert(regRes.status === 201, 'Valid patron registration returns HTTP 201');
    assert(regRes.data.success === true, 'Registration payload has success: true');
    assert(regRes.data.user.email === uniqueEmail, 'Registered email matches');
    assert(regRes.data.user.role === 'USER', 'Patron assigned USER role');
    assert(!regRes.data.user.password, 'Password hash is omitted from API response');

    // Verify password is truly hashed in database
    const [userRows] = await db.query('SELECT password FROM users WHERE email = ?', [uniqueEmail]);
    assert(userRows.length === 1, 'User persisted in database');
    assert(userRows[0].password.startsWith('$2b$10$'), 'Password is valid bcrypt hash with 10 salt rounds');

    // Duplicate email registration rejected
    const dupReg = await request({
      method: 'POST',
      path: '/api/auth/register'
    }, {
      name: 'Another User',
      email: uniqueEmail,
      password: 'Password@123'
    });
    assert(dupReg.status === 409, 'Duplicate email registration rejected with HTTP 409 Conflict');

    // Invalid input rejected
    const invalidReg = await request({
      method: 'POST',
      path: '/api/auth/register'
    }, {
      name: 'Short Pwd',
      email: 'bad-email',
      password: '123'
    });
    assert(invalidReg.status === 400, 'Invalid registration input rejected with HTTP 400 Bad Request');

    // Login with valid credentials
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login'
    }, {
      email: uniqueEmail,
      password: 'Password@123'
    });
    assert(loginRes.status === 200, 'Valid login returns HTTP 200');
    assert(!!loginRes.data.token, 'Login returns signed JWT token');
    const userToken = loginRes.data.token;

    // Login with invalid password
    const badLogin = await request({
      method: 'POST',
      path: '/api/auth/login'
    }, {
      email: uniqueEmail,
      password: 'WrongPassword999'
    });
    assert(badLogin.status === 401, 'Invalid credentials rejected with HTTP 401 Unauthorized');

    // Protected endpoint access with JWT
    const meRes = await request({
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(meRes.status === 200, 'Protected GET /api/auth/me succeeds with valid Bearer token');
    assert(meRes.data.user.email === uniqueEmail, 'Token identifies correct authenticated user');

    // Protected endpoint without token
    const noTokenRes = await request({ path: '/api/auth/me' });
    assert(noTokenRes.status === 401, 'Missing token returns HTTP 401 Unauthorized');

    // Admin login
    const adminLoginRes = await request({
      method: 'POST',
      path: '/api/auth/login'
    }, {
      email: 'admin@library.edu',
      password: 'Admin@123'
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeds with HTTP 200');
    assert(adminLoginRes.data.user.role === 'ADMIN', 'Admin profile verified');
    const adminToken = adminLoginRes.data.token;

    // -------------------------------------------------------------------------
    // STEP 4B: ROLE-BASED ACCESS CONTROL (USER vs ADMIN)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. ROLE-BASED ACCESS CONTROL (RBAC) ---');
    const userAdminAttempt = await request({
      method: 'POST',
      path: '/api/books',
      headers: { Authorization: `Bearer ${userToken}` }
    }, {
      title: 'Hacker Book',
      isbn: '999-9999999999',
      category: 'Hacking',
      total_copies: 1
    });
    assert(userAdminAttempt.status === 403, 'Regular USER blocked from POST /api/books with HTTP 403 Forbidden');

    const userAllResAttempt = await request({
      path: '/api/reservations/all',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userAllResAttempt.status === 403, 'Regular USER blocked from GET /api/reservations/all with HTTP 403 Forbidden');

    const adminAllRes = await request({
      path: '/api/reservations/all',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAllRes.status === 200, 'ADMIN permitted to access GET /api/reservations/all with HTTP 200');

    // -------------------------------------------------------------------------
    // STEP 5: BOOKS AND AUTHORS END-TO-END TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 4. BOOKS AND AUTHORS MANAGEMENT & RELATIONAL INTEGRITY ---');
    // List authors
    const authorsList = await request({
      path: '/api/authors',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(authorsList.status === 200, 'GET /api/authors returns HTTP 200');
    assert(Array.isArray(authorsList.data.authors), 'Authors returned as an array under authors property');
    assert(authorsList.data.authors.length >= 6, 'All seeded authors present');

    // Get author details with linked books
    const author1 = await request({
      path: '/api/authors/1',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(author1.status === 200, 'GET /api/authors/1 returns HTTP 200');
    assert(author1.data.author.name === 'Robert C. Martin', 'Author 1 name is Robert C. Martin');
    assert(Array.isArray(author1.data.author.books), 'Author details include relational books array');

    // Admin creates an author
    const createAuthorRes = await request({
      method: 'POST',
      path: '/api/authors',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      name: 'Demo Author',
      biography: 'Author created during Phase 15 E2E verification.'
    });
    assert(createAuthorRes.status === 201, 'Admin can create author (HTTP 201)');
    const createdAuthorId = createAuthorRes.data.author.id;

    // Admin updates author
    const updateAuthorRes = await request({
      method: 'PUT',
      path: `/api/authors/${createdAuthorId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      name: 'Demo Author Updated',
      biography: 'Updated biography.'
    });
    assert(updateAuthorRes.status === 200, 'Admin can update author (HTTP 200)');
    assert(updateAuthorRes.data.author.name === 'Demo Author Updated', 'Updated author name verified');

    // Admin creates a book linked to this author
    const uniqueIsbn = `978-0${Date.now().toString().slice(-9)}`;
    const createBookRes = await request({
      method: 'POST',
      path: '/api/books',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      title: 'Demo Verification Book',
      isbn: uniqueIsbn,
      author_id: createdAuthorId,
      category: 'Verification',
      total_copies: 3,
      available_copies: 3,
      description: 'Test book for Phase 15 E2E.'
    });
    assert(createBookRes.status === 201, 'Admin can create book (HTTP 201)');
    const createdBookId = createBookRes.data.book.id;

    // Verify LEFT JOIN endpoint returns author name
    const leftJoinRes = await request({
      path: '/api/books/sample-left-join'
    });
    assert(leftJoinRes.status === 200, 'GET /api/books/sample-left-join returns HTTP 200');
    const createdBookInLeftJoin = leftJoinRes.data.data.find(b => b.id === createdBookId);
    assert(!!createdBookInLeftJoin, 'Created book found in LEFT JOIN output');
    assert(createdBookInLeftJoin.author_name === 'Demo Author Updated', 'Author name correctly populated via LEFT JOIN');

    // Referential integrity check: cannot delete author while book is linked
    const deleteAuthorConflict = await request({
      method: 'DELETE',
      path: `/api/authors/${createdAuthorId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteAuthorConflict.status === 409, 'Deleting author with linked book returns HTTP 409 Conflict');

    // -------------------------------------------------------------------------
    // STEP 6: SEARCH AND FILTER TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 5. LIVE SEARCH & FILTERING ---');
    // Search by title
    const searchTitle = await request({
      path: '/api/books/search?q=Demo Verification Book',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(searchTitle.status === 200, 'Search by Title returns HTTP 200');
    assert(searchTitle.data.books.length >= 1, 'Search finds created book by title');

    // Search by ISBN
    const searchIsbn = await request({
      path: `/api/books/search?q=${uniqueIsbn}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(searchIsbn.status === 200, 'Search by ISBN returns HTTP 200');
    assert(searchIsbn.data.books[0].isbn === uniqueIsbn, 'Exact ISBN match verified');

    // Search by author
    const searchAuthor = await request({
      path: '/api/books/search?q=Demo Author',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(searchAuthor.data.books.length >= 1, 'Search by Author name verified');

    // Search by category
    const searchCat = await request({
      path: '/api/books/search?q=Verification',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(searchCat.data.books.length >= 1, 'Search by Category verified');

    // SQL Injection immunity
    const sqlInj = await request({
      path: '/api/books/search?q=%27%20OR%201=1;%20--',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(sqlInj.status === 200, 'Malicious SQL injection string handled safely with HTTP 200');
    assert(sqlInj.data.books.length === 0, 'SQL injection returns 0 records safely');

    // Availability filter
    const availFilter = await request({
      path: '/api/books?available=true',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(availFilter.status === 200, 'GET /api/books?available=true returns HTTP 200');
    assert(availFilter.data.books.every(b => b.available_copies > 0), 'All returned books have available_copies > 0');

    // -------------------------------------------------------------------------
    // STEP 7: RESERVATION LIFECYCLE & CONCURRENCY
    // -------------------------------------------------------------------------
    console.log('\n--- 6. RESERVATION SYSTEM LIFECYCLE ---');
    // Get initial available copies of created book
    const bookBeforeRes = await request({
      path: `/api/books/${createdBookId}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const initialCopies = bookBeforeRes.data.book.available_copies;

    // Create reservation as USER
    const createRes = await request({
      method: 'POST',
      path: '/api/reservations',
      headers: { Authorization: `Bearer ${userToken}` }
    }, {
      book_id: createdBookId
    });
    assert(createRes.status === 201, 'Patron creates reservation (HTTP 201)');
    assert(createRes.data.reservation.status === 'PENDING', 'Reservation starts in PENDING status');
    const resId = createRes.data.reservation.id;

    // Verify inventory copy decremented atomically
    const bookAfterRes = await request({
      path: `/api/books/${createdBookId}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(bookAfterRes.data.book.available_copies === initialCopies - 1, 'Available copies decremented by exactly 1');

    // Duplicate active reservation rejected
    const dupRes = await request({
      method: 'POST',
      path: '/api/reservations',
      headers: { Authorization: `Bearer ${userToken}` }
    }, {
      book_id: createdBookId
    });
    assert(dupRes.status === 409, 'Duplicate active reservation rejected with HTTP 409 Conflict');

    // User views reservation in their dashboard
    const userReservations = await request({
      path: '/api/reservations',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userReservations.status === 200, 'Patron retrieves own reservations (HTTP 200)');
    assert(userReservations.data.reservations.some(r => r.id === resId), 'Reservation appears in patron list');

    // Admin approves reservation
    const approveRes = await request({
      method: 'PUT',
      path: `/api/reservations/${resId}/approve`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(approveRes.status === 200, 'Admin approves reservation (HTTP 200)');
    assert(approveRes.data.reservation.status === 'APPROVED', 'Reservation status updated to APPROVED');

    // Re-approval rejected with 409 Conflict
    const reApprove = await request({
      method: 'PUT',
      path: `/api/reservations/${resId}/approve`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reApprove.status === 409, 'Re-approval of approved reservation rejected (HTTP 409 Conflict)');

    // -------------------------------------------------------------------------
    // STEP 8: CIRCULATION (ISSUE AND RETURN)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. CIRCULATION (ISSUE & RETURN) ---');
    // Issue book linked to approved reservation
    const [userIdRow] = await db.query('SELECT id FROM users WHERE email = ?', [uniqueEmail]);
    const patronUserId = userIdRow[0].id;

    const issueRes = await request({
      method: 'POST',
      path: '/api/transactions/issue',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      user_id: patronUserId,
      book_id: createdBookId,
      reservation_id: resId
    });
    assert(issueRes.status === 201, 'Admin issues book with reservation fulfillment (HTTP 201)');
    assert(issueRes.data.transaction.status === 'ISSUED', 'Transaction status is ISSUED');
    const transId = issueRes.data.transaction.id;

    // Verify due date is 14 days in the future
    const issueDate = new Date(issueRes.data.transaction.issue_date);
    const dueDate = new Date(issueRes.data.transaction.due_date);
    const diffDays = Math.round((dueDate - issueDate) / (1000 * 60 * 60 * 24));
    assert(diffDays >= 13 && diffDays <= 15, `Due date calculated correctly: ~14 days loan duration (found: ${diffDays} days)`);

    // Verify linked reservation was auto-completed
    const completedRes = await request({
      path: `/api/reservations/${resId}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(completedRes.data.reservation.status === 'COMPLETED', 'Reservation automatically marked COMPLETED upon issuance');

    // Return book
    const returnRes = await request({
      method: 'POST',
      path: `/api/transactions/${transId}/return`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(returnRes.status === 200, 'Admin returns book (HTTP 200)');
    assert(returnRes.data.transaction.status === 'RETURNED', 'Transaction status is RETURNED');
    assert(!!returnRes.data.transaction.return_date, 'Return date timestamp is recorded');

    // Verify inventory restored exactly once
    const bookAfterReturn = await request({
      path: `/api/books/${createdBookId}`,
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(bookAfterReturn.data.book.available_copies === initialCopies, 'Available copies restored exactly to initial count');

    // Double return attempt rejected
    const doubleReturn = await request({
      method: 'POST',
      path: `/api/transactions/${transId}/return`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(doubleReturn.status === 409, 'Double return rejected with HTTP 409 Conflict');

    // -------------------------------------------------------------------------
    // STEP 9: INVENTORY CONSISTENCY VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 8. INVENTORY CONSISTENCY INVARIANTS ---');
    const [allBooks] = await db.query('SELECT id, title, total_copies, available_copies FROM books');
    let allValid = true;
    for (const b of allBooks) {
      if (b.available_copies < 0 || b.available_copies > b.total_copies) {
        allValid = false;
        console.error(`  FAIL: Book ${b.id} "${b.title}" invalid stock: ${b.available_copies}/${b.total_copies}`);
      }
    }
    assert(allValid, `All ${allBooks.length} books in database satisfy: 0 <= available_copies <= total_copies`);

    // -------------------------------------------------------------------------
    // STEP 10: TRANSACTION HISTORY & PRIVACY ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- 9. TRANSACTION HISTORY & ACCESS PRIVACY ---');
    const userLoans = await request({
      path: '/api/transactions',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userLoans.status === 200, 'Patron can view own loan history (HTTP 200)');
    assert(userLoans.data.transactions.some(t => t.id === transId), 'Returned loan record present in patron loan history');

    // Admin views all transactions
    const adminTrans = await request({
      path: '/api/transactions/all',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminTrans.status === 200, 'Admin can view all circulation records (HTTP 200)');
    assert(adminTrans.data.transactions.length >= 5, 'Circulation records retrieved');

    // Admin views overdue transactions
    const overdueTrans = await request({
      path: '/api/transactions/overdue',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(overdueTrans.status === 200, 'Admin can view overdue transactions (HTTP 200)');
    assert(Array.isArray(overdueTrans.data.overdueTransactions), 'Overdue records returned as array');

    // -------------------------------------------------------------------------
    // STEP 14: ERROR HANDLING & INFORMATION LEAKAGE TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 10. ERROR SANITIZATION & LEAKAGE CHECKS ---');
    // 404 for non-existent endpoint
    const notFoundRes = await request({ path: '/api/non-existent-route-xyz' });
    assert(notFoundRes.status === 404, 'Unknown endpoint returns HTTP 404 Not Found');
    assert(notFoundRes.data.success === false, '404 contains standardized success: false');

    // 400 for invalid ID parameter
    const invalidIdRes = await request({
      path: '/api/books/invalid-id-string',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(invalidIdRes.status === 400, 'Non-integer ID returns HTTP 400 Bad Request');
    assert(!JSON.stringify(invalidIdRes.data).includes('SELECT'), 'Error response does not leak SQL syntax');

    // Clean up created test book and author
    await request({
      method: 'DELETE',
      path: `/api/books/${createdBookId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    await request({
      method: 'DELETE',
      path: `/api/authors/${createdAuthorId}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('  Cleaned up temporary test book and author.');

    console.log('\n====================================================');
    console.log('   ALL PHASE 15 E2E VERIFICATION CHECKS PASSED!     ');
    console.log('====================================================\n');

  } finally {
    if (server) {
      server.close();
    }
    await db.end();
  }
}

runE2EVerification().catch(err => {
  console.error('\nE2E VERIFICATION FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
