const app = require('../src/app');
const db = require('../src/config/db');

async function runPhase6TestSuite() {
  const PORT = 5004;
  const server = app.listen(PORT, async () => {
    try {
      console.log('=== RUNNING PHASE 6 RESERVATION & TRANSACTION TEST SUITE ===\n');

      // 0. Setup: Obtain Admin & Multiple User Tokens
      const adminLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@library.edu', password: 'Admin@123' })
      });
      const adminData = await adminLoginRes.json();
      const adminToken = adminData.token;

      const user1LoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rahul.sharma@college.edu', password: 'Student@123' })
      });
      const user1Data = await user1LoginRes.json();
      const user1Token = user1Data.token; // Rahul (ID: 2)

      const user2LoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'priya.patel@college.edu', password: 'Student@123' })
      });
      const user2Data = await user2LoginRes.json();
      const user2Token = user2Data.token; // Priya (ID: 3)

      console.log('0. Auth Setup: Admin & 2 Student tokens acquired: PASS');

      // -----------------------------------------------------------------------
      // 1. RESERVATION CREATION & VALIDATION TESTS
      // -----------------------------------------------------------------------
      console.log('\n--- 1. RESERVATION CREATION & VALIDATION ---');

      // 1. Create a dedicated test book with 2 copies
      await db.query('DELETE FROM books WHERE isbn = ?', ['978-7777777777']);
      const [bookInsert] = await db.query(
        `INSERT INTO books (title, isbn, author_id, category, total_copies, available_copies, description)
         VALUES (?, ?, ?, ?, 2, 2, ?)`,
        ['Concurrency Test Volume', '978-7777777777', 1, 'Computer Science', 'Test book for reservation lifecycle']
      );
      const testBookId = bookInsert.insertId;

      // Test 1a: Create reservation without auth token (401)
      const rNoToken = await fetch(`http://localhost:${PORT}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: testBookId })
      });
      console.log('1a. Create Reservation Without Token (401):', rNoToken.status === 401 ? 'PASS (401)' : 'FAIL');

      // Test 1b: Create reservation with non-existent book (404)
      const rNotFound = await fetch(`http://localhost:${PORT}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user1Token}`
        },
        body: JSON.stringify({ book_id: 99999 })
      });
      console.log('1b. Create Reservation Non-existent Book (404):', rNotFound.status === 404 ? 'PASS (404)' : 'FAIL');

      // Test 1c: Successful reservation by User 1 (201)
      const rSuccess1 = await fetch(`http://localhost:${PORT}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user1Token}`
        },
        body: JSON.stringify({ book_id: testBookId })
      });
      const rSuccess1Data = await rSuccess1.json();
      const user1ResId = rSuccess1Data.reservation?.id;
      console.log('1c. Successful Reservation (201):', rSuccess1.status === 201 && !!user1ResId ? 'PASS (201)' : 'FAIL', 'Res ID:', user1ResId);

      // Verify inventory decremented from 2 to 1
      const [bookCheck1] = await db.query('SELECT available_copies FROM books WHERE id = ?', [testBookId]);
      console.log('1d. Inventory Decremented (2 -> 1):', bookCheck1[0].available_copies === 1 ? 'PASS (1 remaining)' : 'FAIL');

      // Test 1e: Duplicate active reservation by same user on same book (409 Conflict)
      const rDuplicate = await fetch(`http://localhost:${PORT}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user1Token}`
        },
        body: JSON.stringify({ book_id: testBookId })
      });
      console.log('1e. Duplicate Active Reservation Rejected (409):', rDuplicate.status === 409 ? 'PASS (409 Conflict)' : 'FAIL');

      // -----------------------------------------------------------------------
      // 2. VIEWING RESERVATIONS & PRIVACY
      // -----------------------------------------------------------------------
      console.log('\n--- 2. VIEWING RESERVATIONS & PRIVACY ---');

      // Test 2a: User 1 sees own reservation
      const rUser1List = await fetch(`http://localhost:${PORT}/api/reservations`, {
        headers: { 'Authorization': `Bearer ${user1Token}` }
      });
      const rUser1ListData = await rUser1List.json();
      const hasCreatedRes = rUser1ListData.reservations?.some(r => r.id === user1ResId);
      console.log('2a. User Sees Own Reservations (200):', rUser1List.status === 200 && hasCreatedRes ? 'PASS (200)' : 'FAIL');

      // Test 2b: User 2 cannot access User 1 reservation by ID (403 Forbidden)
      const rUser2Forbidden = await fetch(`http://localhost:${PORT}/api/reservations/${user1ResId}`, {
        headers: { 'Authorization': `Bearer ${user2Token}` }
      });
      console.log('2b. User Cannot View Another User Reservation (403):', rUser2Forbidden.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL');

      // Test 2c: Admin can view any reservation by ID (200)
      const rAdminViewOne = await fetch(`http://localhost:${PORT}/api/reservations/${user1ResId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('2c. Admin Can View User Reservation (200):', rAdminViewOne.status === 200 ? 'PASS (200)' : 'FAIL');

      // Test 2d: User cannot access /api/reservations/all (403 Forbidden)
      const rUserAllForbidden = await fetch(`http://localhost:${PORT}/api/reservations/all`, {
        headers: { 'Authorization': `Bearer ${user1Token}` }
      });
      console.log('2d. User Access /api/reservations/all (403):', rUserAllForbidden.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL');

      // Test 2e: Admin can access /api/reservations/all (200)
      const rAdminAll = await fetch(`http://localhost:${PORT}/api/reservations/all`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const rAdminAllData = await rAdminAll.json();
      console.log('2e. Admin View All Reservations (200):', rAdminAll.status === 200 && rAdminAllData.reservations?.length >= 1 ? 'PASS (200)' : 'FAIL', 'Total:', rAdminAllData.reservations?.length);

      // -----------------------------------------------------------------------
      // 3. ADMIN APPROVAL & CANCELLATION (WITH INVENTORY RESTORATION)
      // -----------------------------------------------------------------------
      console.log('\n--- 3. APPROVAL & CANCELLATION WITH INVENTORY RESTORATION ---');

      // Test 3a: Admin approves reservation
      const rApprove = await fetch(`http://localhost:${PORT}/api/reservations/${user1ResId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const rApproveData = await rApprove.json();
      console.log('3a. Admin Approves Reservation (200):', rApprove.status === 200 && rApproveData.reservation?.status === 'APPROVED' ? 'PASS (APPROVED)' : 'FAIL');

      // Test 3b: Cannot re-approve already approved reservation (409)
      const rReApprove = await fetch(`http://localhost:${PORT}/api/reservations/${user1ResId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('3b. Re-approving Already Approved (409):', rReApprove.status === 409 ? 'PASS (409 Conflict)' : 'FAIL');

      // Test 3c: User cancels reservation -> inventory should be restored from 1 back to 2!
      const rCancel = await fetch(`http://localhost:${PORT}/api/reservations/${user1ResId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user1Token}` }
      });
      const rCancelData = await rCancel.json();
      console.log('3c. User Cancels Reservation (200):', rCancel.status === 200 && rCancelData.reservation?.status === 'CANCELLED' ? 'PASS (CANCELLED)' : 'FAIL');

      // Check inventory restored in DB
      const [bookCheck2] = await db.query('SELECT available_copies FROM books WHERE id = ?', [testBookId]);
      console.log('3d. Inventory Restored After Cancel (1 -> 2):', bookCheck2[0].available_copies === 2 ? 'PASS (Restored to 2)' : 'FAIL');

      // Test 3e: Cannot re-cancel already cancelled reservation (409)
      const rReCancel = await fetch(`http://localhost:${PORT}/api/reservations/${user1ResId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user1Token}` }
      });
      console.log('3e. Re-cancelling Already Cancelled (409):', rReCancel.status === 409 ? 'PASS (409 Conflict)' : 'FAIL');

      // -----------------------------------------------------------------------
      // 4. CIRCULATION: ISSUE & RETURN TRANSACTIONS
      // -----------------------------------------------------------------------
      console.log('\n--- 4. CIRCULATION: ISSUE & RETURN TRANSACTIONS ---');

      // Create a fresh reservation for testing issue
      const rNewRes = await fetch(`http://localhost:${PORT}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user2Token}`
        },
        body: JSON.stringify({ book_id: testBookId })
      });
      const rNewData = await rNewRes.json();
      const user2ResId = rNewData.reservation?.id;
      // Available copies is now 1

      // Test 4a: User cannot issue book (403 Forbidden)
      const tUserIssueForbidden = await fetch(`http://localhost:${PORT}/api/transactions/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user2Token}`
        },
        body: JSON.stringify({ reservation_id: user2ResId })
      });
      console.log('4a. User Issue Book Forbidden (403):', tUserIssueForbidden.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL');

      // Test 4b: Admin issues book for reservation (201)
      const tIssueSuccess = await fetch(`http://localhost:${PORT}/api/transactions/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ reservation_id: user2ResId })
      });
      const tIssueData = await tIssueSuccess.json();
      const txId = tIssueData.transaction?.id;
      const dueDate = tIssueData.transaction?.due_date;
      console.log('4b. Admin Issues Book (201):', tIssueSuccess.status === 201 && !!txId ? 'PASS (201)' : 'FAIL', 'Due Date:', dueDate);

      // Verify reservation transitioned to COMPLETED
      const [resCompletedCheck] = await db.query('SELECT status FROM reservations WHERE id = ?', [user2ResId]);
      console.log('4c. Reservation Completed Upon Issue:', resCompletedCheck[0].status === 'COMPLETED' ? 'PASS (COMPLETED)' : 'FAIL');

      // Test 4d: Cannot cancel a COMPLETED reservation (409)
      const rCancelCompleted = await fetch(`http://localhost:${PORT}/api/reservations/${user2ResId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user2Token}` }
      });
      console.log('4d. Cannot Cancel Completed Reservation (409):', rCancelCompleted.status === 409 ? 'PASS (409 Conflict)' : 'FAIL');

      // Test 4e: User views their own transaction history
      const tUserList = await fetch(`http://localhost:${PORT}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${user2Token}` }
      });
      const tUserListData = await tUserList.json();
      const hasTx = tUserListData.transactions?.some(t => t.id === txId);
      console.log('4e. User Views Transaction History (200):', tUserList.status === 200 && hasTx ? 'PASS (200)' : 'FAIL');

      // Test 4f: Return book via transaction (200) -> restores inventory from 1 to 2
      const tReturn = await fetch(`http://localhost:${PORT}/api/transactions/${txId}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const tReturnData = await tReturn.json();
      console.log('4f. Return Book (200):', tReturn.status === 200 && tReturnData.transaction?.status === 'RETURNED' ? 'PASS (RETURNED)' : 'FAIL');

      // Check inventory restored in DB
      const [bookCheck3] = await db.query('SELECT available_copies FROM books WHERE id = ?', [testBookId]);
      console.log('4g. Inventory Restored After Return (1 -> 2):', bookCheck3[0].available_copies === 2 ? 'PASS (Restored to 2)' : 'FAIL');

      // Test 4h: Double return rejected (409 Conflict)
      const tDoubleReturn = await fetch(`http://localhost:${PORT}/api/transactions/${txId}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('4h. Double Return Rejected (409):', tDoubleReturn.status === 409 ? 'PASS (409 Conflict)' : 'FAIL');

      // -----------------------------------------------------------------------
      // 5. OVERDUE DETECTION TEST
      // -----------------------------------------------------------------------
      console.log('\n--- 5. OVERDUE DETECTION ---');

      // Query overdue endpoint
      const tOverdue = await fetch(`http://localhost:${PORT}/api/transactions/overdue`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const tOverdueData = await tOverdue.json();
      // Seed data contains transaction #2 (Book 4) which is overdue!
      console.log('5a. Overdue Detection API (200):', tOverdue.status === 200 && tOverdueData.overdueTransactions?.length >= 1 ? 'PASS (Found overdue)' : 'FAIL', 'Count:', tOverdueData.overdueTransactions?.length);

      // -----------------------------------------------------------------------
      // 6. CONCURRENCY & RACE-CONDITION SAFETY TEST (Section 25)
      // -----------------------------------------------------------------------
      console.log('\n--- 6. CONCURRENCY & RACE-CONDITION SAFETY TEST ---');

      // Create a book with EXACTLY 1 total copy and 1 available copy
      await db.query('DELETE FROM books WHERE isbn = ?', ['978-8888888888']);
      const [singleCopyInsert] = await db.query(
        `INSERT INTO books (title, isbn, author_id, category, total_copies, available_copies, description)
         VALUES (?, ?, ?, ?, 1, 1, ?)`,
        ['Rare Manuscript (Single Copy)', '978-8888888888', 1, 'Rare Books', 'Only 1 copy exists in the library']
      );
      const singleBookId = singleCopyInsert.insertId;

      console.log('Setting up Single Copy Book: total=1, available=1');

      // Simultaneously trigger reservation requests from User 1 and User 2
      const [resA, resB] = await Promise.all([
        fetch(`http://localhost:${PORT}/api/reservations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user1Token}`
          },
          body: JSON.stringify({ book_id: singleBookId })
        }),
        fetch(`http://localhost:${PORT}/api/reservations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user2Token}`
          },
          body: JSON.stringify({ book_id: singleBookId })
        })
      ]);

      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);

      const statuses = [resA.status, resB.status];
      const hasOneSuccess = statuses.includes(201);
      const hasOneConflict = statuses.includes(409);

      console.log('Concurrent Response 1 Status:', resA.status, dataA.message || dataA.success);
      console.log('Concurrent Response 2 Status:', resB.status, dataB.message || dataB.success);
      console.log('6a. Concurrency Result (Exactly 1 Success, 1 Conflict):', hasOneSuccess && hasOneConflict ? 'PASS (1x201, 1x409)' : 'FAIL');

      // Inspect final database state
      const [finalBookState] = await db.query('SELECT total_copies, available_copies FROM books WHERE id = ?', [singleBookId]);
      const availableIsZero = finalBookState[0].available_copies === 0;
      const notNegative = finalBookState[0].available_copies >= 0;

      console.log('6b. Final Available Copies = 0 (Never Negative):', availableIsZero && notNegative ? 'PASS (available_copies = 0)' : 'FAIL');

      // Clean up test books
      await db.query('DELETE FROM transactions WHERE book_id IN (?, ?)', [testBookId, singleBookId]);
      await db.query('DELETE FROM reservations WHERE book_id IN (?, ?)', [testBookId, singleBookId]);
      await db.query('DELETE FROM books WHERE id IN (?, ?)', [testBookId, singleBookId]);

      console.log('\n=== ALL PHASE 6 TESTS COMPLETED SUCCESSFULLY ===');
    } catch (err) {
      console.error('ERROR IN PHASE 6 TEST SUITE:', err);
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        await db.end();
        console.log('=== TEST SERVER & DB POOL CLOSED CLEANLY ===');
      });
    }
  });
}

runPhase6TestSuite();
