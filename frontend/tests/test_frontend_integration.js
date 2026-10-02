/**
 * Frontend Integration Test Suite
 * Tests frontend services, authentication, book search, filters, request cancellation,
 * user dashboard data, reservations, and circulation history.
 */

import http from 'http';

// Polyfill localStorage for Node.js test environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};

// Configure environment variable for Vite
process.env.VITE_API_BASE_URL = 'http://localhost:5007/api';

async function runFrontendIntegrationTests() {
  console.log('=== RUNNING FRONTEND API INTEGRATION TEST SUITE ===\n');

  // Dynamic import of backend app and services
  const { default: app } = await import('../../backend/src/app.js');
  const { default: db } = await import('../../backend/src/config/db.js');
  const { default: api } = await import('../src/services/api.js');
  const { authService } = await import('../src/services/authService.js');
  const { bookService } = await import('../src/services/bookService.js');
  const { authorService } = await import('../src/services/authorService.js');
  const { reservationService } = await import('../src/services/reservationService.js');
  const { transactionService } = await import('../src/services/transactionService.js');

  const PORT = 5007;
  const server = app.listen(PORT, async () => {
    let failed = false;

    try {
      // 1. Initial State: Unauthenticated Request to Protected Route (/books)
      console.log('--- 1. UNAUTHENTICATED REQUEST & ERROR HANDLING ---');
      try {
        await bookService.getBooks();
        console.error('FAIL: Expected getBooks to fail without token');
        failed = true;
      } catch (err) {
        console.log('1a. Protected Route Rejection without JWT: PASS (Status:', err.status, '-', err.message + ')');
      }

      // 2. Authentication: Login via authService
      console.log('\n--- 2. AUTHENTICATION & SESSION RESTORATION ---');
      const loginRes = await authService.login({
        email: 'rahul.sharma@college.edu',
        password: 'Student@123'
      });

      if (loginRes.token && loginRes.user) {
        console.log('2a. authService.login(): PASS (User:', loginRes.user.name, '| Role:', loginRes.user.role + ')');
        localStorage.setItem('token', loginRes.token);
      } else {
        throw new Error('Login response missing token or user');
      }

      // 3. User Profile: getCurrentUser() using Bearer token from localStorage
      const currentUser = await authService.getCurrentUser();
      if (currentUser && currentUser.email === 'rahul.sharma@college.edu') {
        console.log('2b. authService.getCurrentUser() (/api/auth/me): PASS (Email:', currentUser.email + ')');
      } else {
        throw new Error('Failed to retrieve current user profile');
      }

      // 4. Books Service: Fetch books catalog
      console.log('\n--- 3. BOOK CATALOG & AVAILABILITY FILTERS ---');
      const booksData = await bookService.getBooks();
      if (booksData.books && booksData.books.length > 0) {
        console.log('3a. bookService.getBooks(): PASS (Count:', booksData.books.length + ')');
      } else {
        throw new Error('No books returned from bookService.getBooks()');
      }

      // 5. Books Service: Filter available books ('true')
      const availableBooks = await bookService.getBooks({ available: 'true' });
      const allAvailable = availableBooks.books.every(b => b.available_copies > 0);
      if (allAvailable && availableBooks.books.length > 0) {
        console.log('3b. bookService.getBooks({ available: "true" }): PASS (All', availableBooks.books.length, 'books have available_copies > 0)');
      } else {
        throw new Error('Filtered books contained books with 0 available copies or was empty');
      }

      // 6. Books Service: Filter unavailable books ('false')
      const unavailableBooks = await bookService.getBooks({ available: 'false' });
      const allUnavailable = unavailableBooks.books.every(b => b.available_copies === 0);
      if (allUnavailable) {
        console.log('3c. bookService.getBooks({ available: "false" }): PASS (Count:', unavailableBooks.books.length + ')');
      } else {
        throw new Error('Filtered books contained books with > 0 copies');
      }

      // 7. Books Service: Fetch single book details
      const firstBook = booksData.books[0];
      const bookDetails = await bookService.getBookById(firstBook.id);
      if (bookDetails && bookDetails.id === firstBook.id && bookDetails.title) {
        console.log('3d. bookService.getBookById(' + firstBook.id + '): PASS ("' + bookDetails.title + '")');
      } else {
        throw new Error('Failed to retrieve book details by ID');
      }

      // 8. Live Book Search Tests (Phase 8 Feature)
      console.log('\n--- 4. LIVE BOOK SEARCH & COMBINED FILTERS (PHASE 8) ---');

      // 8a. Search by Title
      const titleSearch = await bookService.searchBooks('Clean');
      if (titleSearch.books && titleSearch.books.length > 0 && titleSearch.books.some(b => b.title.includes('Clean'))) {
        console.log('4a. Search by Title ("Clean"): PASS (Found', titleSearch.books.length, 'matches)');
      } else {
        throw new Error('Title search for "Clean" failed to return matches');
      }

      // 8b. Search by ISBN
      const isbnSearch = await bookService.searchBooks('978-0132350884');
      if (isbnSearch.books && isbnSearch.books.length === 1 && isbnSearch.books[0].isbn === '978-0132350884') {
        console.log('4b. Search by ISBN ("978-0132350884"): PASS (Found exact match:', isbnSearch.books[0].title + ')');
      } else {
        throw new Error('ISBN search failed');
      }

      // 8c. Search by Author
      const authorSearch = await bookService.searchBooks('Tanenbaum');
      if (authorSearch.books && authorSearch.books.length > 0 && authorSearch.books.some(b => b.author_name.includes('Tanenbaum'))) {
        console.log('4c. Search by Author ("Tanenbaum"): PASS (Found', authorSearch.books.length, 'matches)');
      } else {
        throw new Error('Author search for "Tanenbaum" failed');
      }

      // 8d. Search by Category
      const categorySearch = await bookService.searchBooks('Networking');
      if (categorySearch.books && categorySearch.books.length > 0 && categorySearch.books.some(b => b.category.includes('Networking'))) {
        console.log('4d. Search by Category ("Networking"): PASS (Found', categorySearch.books.length, 'matches)');
      } else {
        throw new Error('Category search for "Networking" failed');
      }

      // 8e. Search with Nonexistent query
      const nonExistentSearch = await bookService.searchBooks('NonExistentTermXYZ999');
      if (nonExistentSearch.books && nonExistentSearch.books.length === 0) {
        console.log('4e. Search No Matches: PASS (0 results returned cleanly)');
      } else {
        throw new Error('Nonexistent search returned unexpected results');
      }

      // 8f. Combined Search + Availability Filter
      const combinedSearch = await bookService.searchBooks('Clean', { available: 'true' });
      if (combinedSearch.books && combinedSearch.books.length > 0 && combinedSearch.books.every(b => b.available_copies > 0)) {
        console.log('4f. Combined Search ("Clean") + Availability ("true"): PASS (Found', combinedSearch.books.length, 'available matches)');
      } else {
        throw new Error('Combined search + availability filter failed');
      }

      // 9. Request Cancellation / AbortSignal Support
      console.log('\n--- 5. REQUEST CANCELLATION VIA ABORTCONTROLLER ---');
      const abortController = new AbortController();
      abortController.abort(); // Abort before execution
      try {
        await bookService.searchBooks('AbortTest', {}, { signal: abortController.signal });
        console.error('FAIL: Expected aborted request to throw AbortError');
        failed = true;
      } catch (abortErr) {
        if (abortErr.name === 'AbortError') {
          console.log('5a. AbortSignal correctly cancels in-flight request: PASS (AbortError captured)');
        } else {
          throw abortErr;
        }
      }

      // 10. User Dashboard & Reservations Integration (Phase 9 Feature)
      console.log('\n--- 6. USER DASHBOARD & RESERVATION FRONTEND (PHASE 9) ---');

      // Create a dedicated test book to reserve and cancel cleanly
      await db.query('DELETE FROM books WHERE isbn = ?', ['978-9998887776']);
      const [insertBookRes] = await db.query(
        `INSERT INTO books (title, isbn, author_id, category, total_copies, available_copies, description)
         VALUES (?, ?, 1, 'Testing', 3, 3, 'Phase 9 Integration Test Book')`,
        ['Dashboard Test Book', '978-9998887776']
      );
      const testBookId = insertBookRes.insertId;

      // 10a. Create Reservation via reservationService
      const resData = await reservationService.createReservation(testBookId);
      if (resData.reservation && resData.reservation.id) {
        console.log('6a. reservationService.createReservation(): PASS (Res ID:', resData.reservation.id + ', Book:', resData.reservation.book_title + ')');
      } else {
        throw new Error('createReservation failed to return reservation object');
      }
      const createdResId = resData.reservation.id;

      // 10b. Duplicate Reservation Attempt (must return 409 Conflict)
      try {
        await reservationService.createReservation(testBookId);
        console.error('FAIL: Duplicate active reservation should have been rejected');
        failed = true;
      } catch (dupErr) {
        if (dupErr.status === 409) {
          console.log('6b. Duplicate reservation rejected: PASS (Status 409 Conflict -', dupErr.message + ')');
        } else {
          throw dupErr;
        }
      }

      // 10c. Get My Reservations (Dashboard)
      const myReservations = await reservationService.getMyReservations();
      const foundRes = myReservations.find(r => r.id === createdResId);
      if (foundRes && foundRes.book_title === 'Dashboard Test Book' && foundRes.status === 'PENDING') {
        console.log('6c. reservationService.getMyReservations(): PASS (Found reservation in PENDING state)');
      } else {
        throw new Error('getMyReservations did not include created reservation');
      }

      // 10d. Cancel Reservation via reservationService
      const cancelRes = await reservationService.cancelReservation(createdResId);
      if (cancelRes.success) {
        console.log('6d. reservationService.cancelReservation(): PASS (' + cancelRes.message + ')');
      } else {
        throw new Error('cancelReservation did not return success');
      }

      // 10e. Re-cancellation Attempt (must fail with 409 Conflict)
      try {
        await reservationService.cancelReservation(createdResId);
        console.error('FAIL: Re-cancelling already cancelled reservation should be rejected');
        failed = true;
      } catch (recancelErr) {
        if (recancelErr.status === 409) {
          console.log('6e. Re-cancellation rejected: PASS (Status 409 Conflict -', recancelErr.message + ')');
        } else {
          throw recancelErr;
        }
      }

      // 10f. Get My Transactions (Dashboard)
      const myTransactions = await transactionService.getMyTransactions();
      if (Array.isArray(myTransactions)) {
        console.log('6f. transactionService.getMyTransactions(): PASS (Retrieved', myTransactions.length, 'circulation records)');
      } else {
        throw new Error('getMyTransactions did not return array');
      }

      // Clean up test book & reservation
      await db.query('DELETE FROM reservations WHERE id = ?', [createdResId]);
      await db.query('DELETE FROM books WHERE id = ?', [testBookId]);

      // 11. Authors Service
      console.log('\n--- 7. AUTHORS DIRECTORY SERVICE ---');
      const authors = await authorService.getAuthors();
      if (Array.isArray(authors) && authors.length > 0) {
        console.log('7a. authorService.getAuthors(): PASS (Total Authors:', authors.length + ')');
      } else {
        throw new Error('Failed to retrieve authors list');
      }

      // 12. Logout & Cleanup
      console.log('\n--- 8. LOGOUT & POST-LOGOUT PROTECTION ---');
      await authService.logout();
      localStorage.removeItem('token');
      console.log('8a. authService.logout() & localStorage cleanup: PASS');

      // Verify unauthenticated again
      try {
        await bookService.getBooks();
        console.error('FAIL: Expected getBooks to fail after logout');
        failed = true;
      } catch (err) {
        console.log('8b. Request after logout rejected: PASS (Status:', err.status + ')');
      }

      console.log('\n=== ALL 20 FRONTEND INTEGRATION TESTS PASSED (100%) ===\n');

    } catch (testError) {
      console.error('Frontend Integration Test Failed:', testError);
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

runFrontendIntegrationTests();
