/**
 * Phase 11 Error Handling & Validation Test Suite
 * Tests standardized JSON errors, HTTP status codes, malformed JSON handling,
 * input validation, parameter sanitization, and role-based security.
 */

const app = require('../src/app');
const db = require('../src/config/db');

async function testErrorHandlingSuite() {
  const PORT = 5005;
  const server = app.listen(PORT, async () => {
    let failed = false;
    try {
      console.log('=== RUNNING PHASE 11 ERROR HANDLING & VALIDATION TEST SUITE ===\n');

      let userToken = '';
      let adminToken = '';

      // Acquire tokens
      const userLogin = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rahul.sharma@college.edu', password: 'Student@123' }),
      });
      const userData = await userLogin.json();
      userToken = userData.token;

      const adminLogin = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@library.edu', password: 'Admin@123' }),
      });
      const adminData = await adminLogin.json();
      adminToken = adminData.token;

      console.log('0. Auth tokens initialized for test runner: PASS');

      // --- 1. MALFORMED JSON & PARSING ERRORS ---
      console.log('\n--- 1. PARSER & PROTOCOL ERRORS ---');
      const malformedRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "email": "test@test.com", invalid_json }',
      });
      const malformedData = await malformedRes.json();
      if (
        malformedRes.status === 400 &&
        malformedData.success === false &&
        malformedData.message.includes('Malformed JSON')
      ) {
        console.log('1a. Malformed JSON Body: PASS (400 Bad Request - ' + malformedData.message + ')');
      } else {
        throw new Error('Malformed JSON body was not handled with 400');
      }

      // --- 2. 404 NOT FOUND ROUTE HANDLING ---
      console.log('\n--- 2. NOT FOUND HANDLING ---');
      const notFoundRes = await fetch(`http://localhost:${PORT}/api/non-existent-route-xyz`);
      const notFoundData = await notFoundRes.json();
      if (notFoundRes.status === 404 && notFoundData.success === false) {
        console.log('2a. Non-existent route: PASS (404 Not Found - ' + notFoundData.message + ')');
      } else {
        throw new Error('Unmatched route did not return 404');
      }

      // --- 3. INPUT VALIDATION: AUTHENTICATION ---
      console.log('\n--- 3. AUTHENTICATION VALIDATION ---');
      const regNoName = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '   ', email: 'test@library.edu', password: 'password123' }),
      });
      const regNoNameData = await regNoName.json();
      if (regNoName.status === 400 && regNoNameData.message.includes('Name is required')) {
        console.log('3a. Register Empty Name: PASS (400 - ' + regNoNameData.message + ')');
      } else {
        throw new Error('Register empty name validation failed');
      }

      const regBadEmail = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'bademail.com', password: 'password123' }),
      });
      const regBadEmailData = await regBadEmail.json();
      if (regBadEmail.status === 400 && regBadEmailData.message.includes('Invalid email format')) {
        console.log('3b. Register Bad Email Format: PASS (400 - ' + regBadEmailData.message + ')');
      } else {
        throw new Error('Register invalid email validation failed');
      }

      const regShortPass = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'shortpass@library.edu', password: '123' }),
      });
      const regShortPassData = await regShortPass.json();
      if (regShortPass.status === 400 && regShortPassData.message.includes('at least 6 characters')) {
        console.log('3c. Register Short Password: PASS (400 - ' + regShortPassData.message + ')');
      } else {
        throw new Error('Register short password validation failed');
      }

      const loginNoPass = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@library.edu' }),
      });
      const loginNoPassData = await loginNoPass.json();
      if (loginNoPass.status === 400 && loginNoPassData.message.includes('Password is required')) {
        console.log('3d. Login Missing Password: PASS (400 - ' + loginNoPassData.message + ')');
      } else {
        throw new Error('Login missing password validation failed');
      }

      // --- 4. PARAMETER ID VALIDATION ---
      console.log('\n--- 4. NUMERIC PARAMETER VALIDATION ---');
      const bookBadId = await fetch(`http://localhost:${PORT}/api/books/not-a-number`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const bookBadIdData = await bookBadId.json();
      if (bookBadId.status === 400 && bookBadIdData.message.includes('Invalid book ID')) {
        console.log('4a. Book String ID ("not-a-number"): PASS (400 - ' + bookBadIdData.message + ')');
      } else {
        throw new Error('Non-numeric book ID was not rejected with 400');
      }

      const authorBadId = await fetch(`http://localhost:${PORT}/api/authors/-5`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const authorBadIdData = await authorBadId.json();
      if (authorBadId.status === 400 && authorBadIdData.message.includes('Invalid author ID')) {
        console.log('4b. Author Negative ID (-5): PASS (400 - ' + authorBadIdData.message + ')');
      } else {
        throw new Error('Negative author ID was not rejected with 400');
      }

      const resBadId = await fetch(`http://localhost:${PORT}/api/reservations/abc`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const resBadIdData = await resBadId.json();
      if (resBadId.status === 400 && resBadIdData.message.includes('Invalid reservation ID')) {
        console.log('4c. Reservation String ID ("abc"): PASS (400 - ' + resBadIdData.message + ')');
      } else {
        throw new Error('Non-numeric reservation ID was not rejected with 400');
      }

      const txBadId = await fetch(`http://localhost:${PORT}/api/transactions/abc/return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const txBadIdData = await txBadId.json();
      if (txBadId.status === 400 && txBadIdData.message.includes('Invalid transaction ID')) {
        console.log('4d. Transaction Return Bad ID ("abc"): PASS (400 - ' + txBadIdData.message + ')');
      } else {
        throw new Error('Non-numeric transaction ID was not rejected with 400');
      }

      // --- 5. AUTHOR & BOOK BUSINESS CONFLICT HANDLING ---
      console.log('\n--- 5. BUSINESS CONFLICT & REFERENTIAL INTEGRITY ---');
      const delAuthorConflict = await fetch(`http://localhost:${PORT}/api/authors/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const delAuthorConflictData = await delAuthorConflict.json();
      if (delAuthorConflict.status === 409 && delAuthorConflictData.message.includes('reference this author')) {
        console.log('5a. Delete Author with Books: PASS (409 Conflict - ' + delAuthorConflictData.message + ')');
      } else {
        throw new Error('Delete author with books was not rejected with 409');
      }

      const delBookConflict = await fetch(`http://localhost:${PORT}/api/books/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const delBookConflictData = await delBookConflict.json();
      if (delBookConflict.status === 409) {
        console.log('5b. Delete Book with Active History: PASS (409 Conflict - ' + delBookConflictData.message + ')');
      } else {
        throw new Error('Delete book with active history was not rejected with 409');
      }

      // --- 6. ROLE-BASED ACCESS CONTROL (403 FORBIDDEN) ---
      console.log('\n--- 6. ROLE-BASED ACCESS CONTROL ---');
      const userCreateBook = await fetch(`http://localhost:${PORT}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          title: 'Hacked Book',
          isbn: '978-0000000099',
          author_id: 1,
          total_copies: 1,
        }),
      });
      const userCreateBookData = await userCreateBook.json();
      if (userCreateBook.status === 403 && userCreateBookData.message.includes('not authorized')) {
        console.log('6a. Regular User on Admin API: PASS (403 Forbidden - ' + userCreateBookData.message + ')');
      } else {
        throw new Error('Regular user was not rejected with 403 on admin endpoint');
      }

      // --- 7. SANITIZED ERROR RESPONSES (NO SQL / NO LEAKAGE) ---
      console.log('\n--- 7. ERROR SANITIZATION & SECURITY LEAKAGE CHECKS ---');
      const errorResponses = [
        malformedData,
        notFoundData,
        regNoNameData,
        bookBadIdData,
        delAuthorConflictData,
        userCreateBookData,
      ];

      for (const resObj of errorResponses) {
        if (resObj.success !== false) {
          throw new Error('Error response missing success: false');
        }
        if (!resObj.message || typeof resObj.message !== 'string') {
          throw new Error('Error response missing valid string message');
        }
        // Ensure no SQL statements leaked
        const lowerMsg = resObj.message.toLowerCase();
        if (
          lowerMsg.includes('select ') ||
          lowerMsg.includes('insert into') ||
          lowerMsg.includes('update ') ||
          lowerMsg.includes('delete from') ||
          lowerMsg.includes('er_dup_entry') ||
          lowerMsg.includes('sqlMessage')
        ) {
          throw new Error('Internal SQL query leaked in user-facing message: ' + resObj.message);
        }
      }
      console.log('7a. All error responses conform to { success: false, message: ... }: PASS');
      console.log('7b. No SQL statements or internal traces leaked to client: PASS');

      console.log('\n=== ALL PHASE 11 ERROR HANDLING & VALIDATION TESTS PASSED (100%) ===\n');
    } catch (testError) {
      console.error('Phase 11 Test Failure:', testError);
      failed = true;
    } finally {
      server.close(() => {
        db.end(() => {
          if (failed) process.exit(1);
        });
      });
    }
  });
}

testErrorHandlingSuite();
