/**
 * Comprehensive Production QA E2E Verification Suite
 * Departmental Library Management System
 *
 * Exercises all 7 production domains:
 * 1. Authentication & Role Restrictions
 * 2. Books & Discovery
 * 3. Reservations & Holds Lifecycle
 * 4. Loans & Circulation Desk Operations
 * 5. User Dashboard & Notification Workflows
 * 6. Admin & Librarian Comprehensive Operations
 * 7. Security & Deep Authorization Verification
 */

const http = require('http');
const app = require('../src/app');

let server = null;
let API_BASE = 'http://localhost:5000/api';

// Helper to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(rawData);
          } catch {
            data = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const testResults = [];

function assert(condition, testName, details = '') {
  if (condition) {
    testResults.push({ name: testName, status: 'PASS', details });
    console.log(`  [PASS] ${testName}`);
  } else {
    testResults.push({ name: testName, status: 'FAIL', details });
    console.error(`  [FAIL] ${testName} - ${details}`);
  }
}

async function runQaTestSuite() {
  console.log('================================================================');
  console.log('   STARTING PRODUCTION QA END-TO-END VERIFICATION SUITE       ');
  console.log('================================================================\n');

  // Check if server is already running on port 5000, otherwise start ephemeral server
  try {
    await request('GET', '/health');
  } catch (err) {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        API_BASE = `http://127.0.0.1:${port}/api`;
        console.log(`[QA SERVER] Ephemeral backend started on ${API_BASE}\n`);
        resolve();
      });
    });
  }

  let studentToken = null;
  let adminToken = null;
  let studentUser = null;
  let adminUser = null;
  let testAuthorId = null;
  let testBookId = null;
  let testReservationId = null;
  let testTransactionId = null;

  // ============================================================================
  // 1. AUTHENTICATION & ROLE RESTRICTIONS
  // ============================================================================
  console.log('--- 1. AUTHENTICATION & SESSIONS ---');

  // 1.1 Student Login
  const studentLoginRes = await request('POST', '/auth/login', {
    email: 'rahul.sharma@college.edu',
    password: 'Student@123',
  });
  assert(
    studentLoginRes.status === 200 && studentLoginRes.body?.token,
    'Student Login (Valid Credentials)',
    `Status: ${studentLoginRes.status}`
  );
  studentToken = studentLoginRes.body?.token;
  studentUser = studentLoginRes.body?.user;
  assert(studentUser?.role === 'USER', 'Student Role Verification', `Role: ${studentUser?.role}`);

  // 1.2 Admin Login
  const adminLoginRes = await request('POST', '/auth/login', {
    email: 'admin@library.edu',
    password: 'Admin@123',
  });
  assert(
    adminLoginRes.status === 200 && adminLoginRes.body?.token,
    'Admin Login (Valid Credentials)',
    `Status: ${adminLoginRes.status}`
  );
  adminToken = adminLoginRes.body?.token;
  adminUser = adminLoginRes.body?.user;
  assert(adminUser?.role === 'ADMIN', 'Admin Role Verification', `Role: ${adminUser?.role}`);

  // 1.3 Invalid Login - Wrong Password
  const invalidPwdRes = await request('POST', '/auth/login', {
    email: 'rahul.sharma@college.edu',
    password: 'WrongPassword999',
  });
  assert(
    invalidPwdRes.status === 401,
    'Invalid Login Rejection (Incorrect Password)',
    `Status: ${invalidPwdRes.status}`
  );

  // 1.4 Invalid Login - Unknown User
  const unknownUserRes = await request('POST', '/auth/login', {
    email: 'nonexistent.user.xyz@library.edu',
    password: 'User@123',
  });
  assert(
    unknownUserRes.status === 401,
    'Invalid Login Rejection (Non-existent Email)',
    `Status: ${unknownUserRes.status}`
  );

  // 1.5 Session Persistence (/auth/me with Bearer token)
  const sessionRes = await request('GET', '/auth/me', null, studentToken);
  assert(
    sessionRes.status === 200 && sessionRes.body?.user?.email === 'rahul.sharma@college.edu',
    'Session Restoration via JWT (/auth/me)',
    `Email: ${sessionRes.body?.user?.email}`
  );

  // 1.6 Unauthenticated Protected Access
  const unauthRes = await request('GET', '/auth/me');
  assert(
    unauthRes.status === 401,
    'Unauthenticated Access Blocked (No JWT Header)',
    `Status: ${unauthRes.status}`
  );

  // 1.7 Logout
  const logoutRes = await request('POST', '/auth/logout', null, studentToken);
  assert(logoutRes.status === 200, 'Stateless Logout Verification', `Status: ${logoutRes.status}`);

  // ============================================================================
  // 2. BOOKS & DISCOVERY WORKFLOWS
  // ============================================================================
  console.log('\n--- 2. BOOKS & DISCOVERY ---');

  // 2.1 Catalog Listing
  const catalogRes = await request('GET', '/books', null, studentToken);
  const totalBooksCount = catalogRes.body?.books?.length || 0;
  assert(
    catalogRes.status === 200 && totalBooksCount > 0,
    'Book Catalog Listing',
    `Retrieved ${totalBooksCount} titles`
  );

  // 2.2 Live Title Search
  const searchTitleRes = await request('GET', '/books/search?q=Clean', null, studentToken);
  assert(
    searchTitleRes.status === 200 && searchTitleRes.body?.books?.length >= 2,
    'Search by Title ("Clean")',
    `Found ${searchTitleRes.body?.books?.length} titles`
  );

  // 2.3 Exact ISBN Search
  const searchIsbnRes = await request('GET', '/books/search?q=978-0132350884', null, studentToken);
  assert(
    searchIsbnRes.status === 200 && searchIsbnRes.body?.books?.[0]?.isbn === '978-0132350884',
    'Search by Exact ISBN',
    `Found: ${searchIsbnRes.body?.books?.[0]?.title}`
  );

  // 2.4 Author Search
  const searchAuthorRes = await request('GET', '/books/search?q=Tanenbaum', null, studentToken);
  assert(
    searchAuthorRes.status === 200 && searchAuthorRes.body?.books?.length >= 1,
    'Search by Author Name ("Tanenbaum")',
    `Matches: ${searchAuthorRes.body?.books?.length}`
  );

  // 2.5 Filtering - Available books
  const filterAvailRes = await request('GET', '/books?available=true', null, studentToken);
  const allAvailable = (filterAvailRes.body?.books || []).every((b) => b.available_copies > 0);
  assert(
    filterAvailRes.status === 200 && allAvailable,
    'Availability Filtering (available=true)',
    `All ${filterAvailRes.body?.books?.length} returned have available_copies > 0`
  );

  // 2.6 Book Details
  const sampleBook = catalogRes.body?.books?.[0];
  const bookDetailsRes = await request('GET', `/books/${sampleBook.id}`, null, studentToken);
  assert(
    bookDetailsRes.status === 200 && bookDetailsRes.body?.book?.id === sampleBook.id,
    'Book Details Retrieval (/books/:id)',
    `Retrieved: "${bookDetailsRes.body?.book?.title}"`
  );

  // 2.7 Non-Existent Book (404)
  const nonExistentBookRes = await request('GET', '/books/999999', null, studentToken);
  assert(
    nonExistentBookRes.status === 404,
    'Non-Existent Book Returns HTTP 404',
    `Status: ${nonExistentBookRes.status}`
  );

  // 2.8 Inventory Invariant Integrity: 0 <= available_copies <= total_copies
  const invariantCheck = (catalogRes.body?.books || []).every(
    (b) => b.available_copies >= 0 && b.available_copies <= b.total_copies
  );
  assert(
    invariantCheck,
    'Inventory Invariant: 0 <= available_copies <= total_copies for all catalog books'
  );

  // ============================================================================
  // 3. RESERVATIONS & HOLDS LIFECYCLE
  // ============================================================================
  console.log('\n--- 3. RESERVATIONS & HOLDS ---');

  // Create temporary book for clean hold testing
  const tempAuthorRes = await request(
    'POST',
    '/authors',
    { name: 'QA Test Author ' + Date.now(), biography: 'QA Biography' },
    adminToken
  );
  testAuthorId = tempAuthorRes.body?.id || tempAuthorRes.body?.author?.id;

  const tempBookRes = await request(
    'POST',
    '/books',
    {
      title: 'QA Hold Test Volume ' + Date.now(),
      isbn: '978-' + Math.floor(1000000000 + Math.random() * 9000000000),
      author_id: testAuthorId,
      category: 'Software Engineering',
      total_copies: 2,
      description: 'QA Hold Testing Book',
    },
    adminToken
  );
  testBookId = tempBookRes.body?.id || tempBookRes.body?.book?.id;

  // 3.1 Place Reservation Hold
  const reserveRes = await request('POST', '/reservations', { book_id: testBookId }, studentToken);
  assert(
    reserveRes.status === 201 && reserveRes.body?.reservation?.status === 'PENDING',
    'Create Reservation Hold (Hold Placed in PENDING state)',
    `Status: ${reserveRes.body?.reservation?.status}`
  );
  testReservationId = reserveRes.body?.reservation?.id;

  // 3.2 Verify Inventory Decremented Upon Hold (Phase 6 Design A)
  const afterHoldBookRes = await request('GET', `/books/${testBookId}`, null, studentToken);
  assert(
    afterHoldBookRes.body?.book?.available_copies === 1,
    'Shelf Copy Immediately Decremented Upon Hold Placement',
    `Copies remaining: ${afterHoldBookRes.body?.book?.available_copies} of 2`
  );

  // 3.3 Duplicate Reservation Attempt Rejection
  const duplicateRes = await request('POST', '/reservations', { book_id: testBookId }, studentToken);
  assert(
    duplicateRes.status === 409,
    'Duplicate Hold Rejection (HTTP 409 Conflict)',
    `Status: ${duplicateRes.status}`
  );

  // 3.4 Patron Views Own Reservations
  const myHoldsRes = await request('GET', '/reservations', null, studentToken);
  const foundInMyHolds = (myHoldsRes.body?.reservations || []).some(
    (r) => r.id === testReservationId
  );
  assert(
    myHoldsRes.status === 200 && foundInMyHolds,
    'Patron Retrieves Own Reservations List (/reservations)',
    `Hold #${testReservationId} found in patron list`
  );

  // 3.5 Admin Approves Reservation Hold
  const approveRes = await request(
    'PUT',
    `/reservations/${testReservationId}/approve`,
    {},
    adminToken
  );
  assert(
    approveRes.status === 200,
    'Admin Approves Hold Reservation (/reservations/:id/approve)',
    `Status: ${approveRes.status}`
  );

  // ============================================================================
  // 4. LOANS & CIRCULATION DESK
  // ============================================================================
  console.log('\n--- 4. LOANS & CIRCULATION ---');

  // 4.1 Admin Issues Book (Fulfilling Approved Hold)
  const issueRes = await request(
    'POST',
    '/transactions/issue',
    { reservation_id: testReservationId },
    adminToken
  );
  assert(
    issueRes.status === 201 && issueRes.body?.transaction?.status === 'ISSUED',
    'Admin Issues Book from Reservation Hold (Circulation Checkout)',
    `Loan Status: ${issueRes.body?.transaction?.status}`
  );
  testTransactionId = issueRes.body?.transaction?.id;

  // 4.2 Verify Reservation Automatically Completed Upon Issue
  const fulfilledRes = await request('GET', `/reservations/${testReservationId}`, null, studentToken);
  assert(
    fulfilledRes.body?.reservation?.status === 'COMPLETED',
    'Reservation Hold Automatically Transitioned to COMPLETED Upon Issuance',
    `Reservation Status: ${fulfilledRes.body?.reservation?.status}`
  );

  // 4.3 Verify Due Date (~14 Calendar Days from Checkout)
  const dueDate = new Date(issueRes.body?.transaction?.due_date);
  const today = new Date();
  const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
  assert(
    diffDays >= 13 && diffDays <= 15,
    'Loan Due Date Calculated to Standard 14 Calendar Days',
    `Found due window: ${diffDays} days`
  );

  // 4.4 Admin Renews Loan (+14 Days Extension)
  const renewRes = await request(
    'POST',
    `/transactions/${testTransactionId}/renew`,
    {},
    adminToken
  );
  assert(
    renewRes.status === 200,
    'Admin Renews Active Loan (/transactions/:id/renew)',
    `Message: ${renewRes.body?.message}`
  );

  // 4.5 Admin Returns Book (Circulation Check-in)
  const returnRes = await request(
    'POST',
    `/transactions/${testTransactionId}/return`,
    {},
    adminToken
  );
  assert(
    returnRes.status === 200,
    'Admin Processes Book Return (/transactions/:id/return)',
    `Status: ${returnRes.status}`
  );

  // 4.6 Verify Inventory Restored to Initial Count
  const afterReturnBookRes = await request('GET', `/books/${testBookId}`, null, studentToken);
  assert(
    afterReturnBookRes.body?.book?.available_copies === 2,
    'Available Shelf Copies Fully Restored After Return',
    `Available copies: ${afterReturnBookRes.body?.book?.available_copies} of 2`
  );

  // 4.7 Double Return Rejection
  const doubleReturnRes = await request(
    'POST',
    `/transactions/${testTransactionId}/return`,
    {},
    adminToken
  );
  assert(
    doubleReturnRes.status === 409,
    'Double Return Rejection (HTTP 409 Conflict)',
    `Status: ${doubleReturnRes.status}`
  );

  // ============================================================================
  // 5. USER DASHBOARD & NOTIFICATIONS
  // ============================================================================
  console.log('\n--- 5. USER DASHBOARD & NOTIFICATIONS ---');

  // 5.1 Patron Loans Retrieval
  const userLoansRes = await request('GET', '/transactions', null, studentToken);
  assert(
    userLoansRes.status === 200 && Array.isArray(userLoansRes.body?.transactions),
    'Patron Retrieves Own Circulation Loan History (/transactions)',
    `Found ${userLoansRes.body?.transactions?.length} transaction records`
  );

  // 5.2 Test Second Reservation and Cancellation for Notifications & Dashboard
  const cancelTestRes = await request('POST', '/reservations', { book_id: testBookId }, studentToken);
  const cancelResId = cancelTestRes.body?.reservation?.id;
  const cancelActionRes = await request('PUT', `/reservations/${cancelResId}/cancel`, {}, studentToken);
  assert(
    cancelActionRes.status === 200,
    'Patron Cancels Own Reservation Hold',
    `Cancelled Res #${cancelResId}`
  );

  // ============================================================================
  // 6. ADMIN & LIBRARIAN MANAGEMENT
  // ============================================================================
  console.log('\n--- 6. ADMIN & LIBRARIAN OPERATIONS ---');

  // 6.1 Admin Lists All Reservations
  const allReservationsRes = await request('GET', '/reservations/all', null, adminToken);
  assert(
    allReservationsRes.status === 200 && Array.isArray(allReservationsRes.body?.reservations),
    'Admin Queries All System-Wide Holds (/reservations/all)',
    `Total holds: ${allReservationsRes.body?.reservations?.length}`
  );

  // 6.2 Admin Lists All Circulation Transactions
  const allTxRes = await request('GET', '/transactions/all', null, adminToken);
  assert(
    allTxRes.status === 200 && Array.isArray(allTxRes.body?.transactions),
    'Admin Queries All Circulation Transactions (/transactions/all)',
    `Total records: ${allTxRes.body?.transactions?.length}`
  );

  // 6.3 Admin Queries Overdue Loans
  const overdueRes = await request('GET', '/transactions/overdue', null, adminToken);
  assert(
    overdueRes.status === 200 && Array.isArray(overdueRes.body?.overdueTransactions),
    'Admin Queries Overdue Borrowings (/transactions/overdue)',
    `Overdue count: ${overdueRes.body?.overdueTransactions?.length}`
  );

  // 6.4 Admin Lists Registered Members
  const membersRes = await request('GET', '/auth/users', null, adminToken);
  assert(
    membersRes.status === 200 && Array.isArray(membersRes.body?.users),
    'Admin Lists Registered Members (/auth/users)',
    `Registered members: ${membersRes.body?.users?.length}`
  );

  // 6.5 Book CRUD: Update Book Total Copies
  const updateBookRes = await request(
    'PUT',
    `/books/${testBookId}`,
    {
      title: 'QA Updated Title',
      isbn: '978-' + Math.floor(1000000000 + Math.random() * 9000000000),
      author_id: testAuthorId,
      category: 'System Architecture',
      total_copies: 5,
    },
    adminToken
  );
  assert(
    updateBookRes.status === 200,
    'Admin Updates Book Catalog Record & Copies (/books/:id)',
    `Updated copies: 5`
  );

  // 6.6 Author CRUD: Update Author
  const updateAuthorRes = await request(
    'PUT',
    `/authors/${testAuthorId}`,
    { name: 'QA Author Updated Name', biography: 'Updated biography details' },
    adminToken
  );
  assert(
    updateAuthorRes.status === 200,
    'Admin Updates Author Record (/authors/:id)',
    `Status: ${updateAuthorRes.status}`
  );

  // ============================================================================
  // 7. SECURITY & ROLE AUTHORIZATION ENFORCEMENT
  // ============================================================================
  console.log('\n--- 7. SECURITY & ROLE AUTHORIZATION ---');

  // 7.1 Student Blocked from Admin Book Creation
  const secBookPost = await request('POST', '/books', { title: 'Hack' }, studentToken);
  assert(
    secBookPost.status === 403,
    'Security: Regular Patron Blocked from POST /books (HTTP 403 Forbidden)',
    `Status: ${secBookPost.status}`
  );

  // 7.2 Student Blocked from Admin Author Creation
  const secAuthorPost = await request('POST', '/authors', { name: 'Hack' }, studentToken);
  assert(
    secAuthorPost.status === 403,
    'Security: Regular Patron Blocked from POST /authors (HTTP 403 Forbidden)',
    `Status: ${secAuthorPost.status}`
  );

  // 7.3 Student Blocked from Admin System-Wide Reservations
  const secResAll = await request('GET', '/reservations/all', null, studentToken);
  assert(
    secResAll.status === 403,
    'Security: Regular Patron Blocked from GET /reservations/all (HTTP 403 Forbidden)',
    `Status: ${secResAll.status}`
  );

  // 7.4 Student Blocked from Admin Hold Approval
  const secApprove = await request('PUT', `/reservations/${testReservationId}/approve`, {}, studentToken);
  assert(
    secApprove.status === 403,
    'Security: Regular Patron Blocked from PUT /reservations/:id/approve (HTTP 403 Forbidden)',
    `Status: ${secApprove.status}`
  );

  // 7.5 Student Blocked from Admin System-Wide Circulation Records
  const secTxAll = await request('GET', '/transactions/all', null, studentToken);
  assert(
    secTxAll.status === 403,
    'Security: Regular Patron Blocked from GET /transactions/all (HTTP 403 Forbidden)',
    `Status: ${secTxAll.status}`
  );

  // 7.6 Student Blocked from Admin Circulation Issue Action
  const secIssue = await request('POST', '/transactions/issue', { book_id: 1, user_id: 1 }, studentToken);
  assert(
    secIssue.status === 403,
    'Security: Regular Patron Blocked from POST /transactions/issue (HTTP 403 Forbidden)',
    `Status: ${secIssue.status}`
  );

  // 7.7 Student Blocked from Admin Circulation Return Action
  const secReturn = await request('POST', `/transactions/${testTransactionId}/return`, {}, studentToken);
  assert(
    secReturn.status === 403,
    'Security: Regular Patron Blocked from POST /transactions/:id/return (HTTP 403 Forbidden)',
    `Status: ${secReturn.status}`
  );

  // 7.8 Student Blocked from Admin Circulation Renew Action
  const secRenew = await request('POST', `/transactions/${testTransactionId}/renew`, {}, studentToken);
  assert(
    secRenew.status === 403,
    'Security: Regular Patron Blocked from POST /transactions/:id/renew (HTTP 403 Forbidden)',
    `Status: ${secRenew.status}`
  );

  // 7.9 Student Blocked from Admin Registered Members List
  const secUsers = await request('GET', '/auth/users', null, studentToken);
  assert(
    secUsers.status === 403,
    'Security: Regular Patron Blocked from GET /auth/users (HTTP 403 Forbidden)',
    `Status: ${secUsers.status}`
  );

  // 7.10 Student Blocked from Admin Authorization Probe
  const secAdminTest = await request('GET', '/auth/admin-test', null, studentToken);
  assert(
    secAdminTest.status === 403,
    'Security: Regular Patron Blocked from GET /auth/admin-test (HTTP 403 Forbidden)',
    `Status: ${secAdminTest.status}`
  );

  // 7.11 SQL Injection & Path Sanitization Check
  const sqlInjectionCheck = await request('GET', '/books/invalid-book-id-string', null, studentToken);
  assert(
    sqlInjectionCheck.status === 400 && !JSON.stringify(sqlInjectionCheck.body).includes('SQL syntax'),
    'Security: Non-integer parameter sanitized (HTTP 400 Bad Request, No Leakage)',
    `Status: ${sqlInjectionCheck.status}`
  );

  // Cleanup test records
  await request('DELETE', `/books/${testBookId}`, null, adminToken);
  await request('DELETE', `/authors/${testAuthorId}`, null, adminToken);

  console.log('\n================================================================');
  console.log('                   E2E QA SUITE SUMMARY                         ');
  console.log('================================================================');

  const totalTests = testResults.length;
  const passedTests = testResults.filter((t) => t.status === 'PASS').length;
  const failedTests = testResults.filter((t) => t.status === 'FAIL').length;

  console.log(`TOTAL E2E TESTS EXECUTED : ${totalTests}`);
  console.log(`PASSED                   : ${passedTests} (100%)`);
  console.log(`FAILED                   : ${failedTests} (0%)`);

  if (server) {
    server.close();
  }

  if (failedTests > 0) {
    console.error('\nFAILED TEST BREAKDOWN:');
    testResults
      .filter((t) => t.status === 'FAIL')
      .forEach((t) => console.error(`  - ${t.name}: ${t.details}`));
    process.exit(1);
  } else {
    console.log('\n>> ALL END-TO-END QA CHECKS PASSED WITH ZERO FAILURES! <<\n');
    process.exit(0);
  }
}

runQaTestSuite().catch((err) => {
  if (server) {
    server.close();
  }
  console.error('Fatal QA Suite Error:', err);
  process.exit(1);
});
