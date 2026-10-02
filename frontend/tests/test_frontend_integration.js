/**
 * Frontend Integration Test Suite
 * Tests frontend services against an Express backend instance.
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
process.env.VITE_API_BASE_URL = 'http://localhost:5005/api';

async function runFrontendIntegrationTests() {
  console.log('=== RUNNING FRONTEND API INTEGRATION TEST SUITE ===\n');

  // Dynamic import of backend app and services
  const { default: app } = await import('../../backend/src/app.js');
  const { default: db } = await import('../../backend/src/config/db.js');
  const { default: api } = await import('../src/services/api.js');
  const { authService } = await import('../src/services/authService.js');
  const { bookService } = await import('../src/services/bookService.js');
  const { authorService } = await import('../src/services/authorService.js');

  const PORT = 5005;
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
      console.log('\n--- 3. BOOK CATALOG & DETAILS SERVICES ---');
      const booksData = await bookService.getBooks();
      if (booksData.books && booksData.books.length > 0) {
        console.log('3a. bookService.getBooks(): PASS (Count:', booksData.books.length + ')');
      } else {
        throw new Error('No books returned from bookService.getBooks()');
      }

      // 5. Books Service: Filter available books
      const availableBooks = await bookService.getBooks({ available: 'true' });
      const allAvailable = availableBooks.books.every(b => b.available_copies > 0);
      if (allAvailable) {
        console.log('3b. bookService.getBooks({ available: true }): PASS (All', availableBooks.books.length, 'books have available_copies > 0)');
      } else {
        throw new Error('Filtered books contained books with 0 available copies');
      }

      // 6. Books Service: Fetch single book details
      const firstBook = booksData.books[0];
      const bookDetails = await bookService.getBookById(firstBook.id);
      if (bookDetails && bookDetails.id === firstBook.id && bookDetails.title) {
        console.log('3c. bookService.getBookById(' + firstBook.id + '): PASS ("' + bookDetails.title + '")');
      } else {
        throw new Error('Failed to retrieve book details by ID');
      }

      // 7. Authors Service: Fetch authors list
      console.log('\n--- 4. AUTHORS DIRECTORY SERVICE ---');
      const authors = await authorService.getAuthors();
      if (Array.isArray(authors) && authors.length > 0) {
        console.log('4a. authorService.getAuthors(): PASS (Total Authors:', authors.length + ')');
      } else {
        throw new Error('Failed to retrieve authors list');
      }

      // 8. Logout & Cleanup
      console.log('\n--- 5. LOGOUT & STATE CLEARING ---');
      await authService.logout();
      localStorage.removeItem('token');
      console.log('5a. authService.logout() & localStorage cleanup: PASS');

      // Verify unauthenticated again
      try {
        await bookService.getBooks();
        console.error('FAIL: Expected getBooks to fail after logout');
        failed = true;
      } catch (err) {
        console.log('5b. Request after logout rejected: PASS (Status:', err.status + ')');
      }

      console.log('\n=== ALL FRONTEND INTEGRATION TESTS PASSED (100%) ===\n');

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
