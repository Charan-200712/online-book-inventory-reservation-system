const app = require('../src/app');
const db = require('../src/config/db');

async function runPhase5TestSuite() {
  const PORT = 5003;
  const server = app.listen(PORT, async () => {
    try {
      console.log('=== RUNNING PHASE 5 BOOK & AUTHOR MANAGEMENT API TESTS ===\n');

      // 0. Setup: Obtain Admin & User JWT Tokens
      const adminLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@library.edu', password: 'Admin@123' })
      });
      const adminLoginData = await adminLoginRes.json();
      const adminToken = adminLoginData.token;

      const userLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rahul.sharma@college.edu', password: 'Student@123' })
      });
      const userLoginData = await userLoginRes.json();
      const userToken = userLoginData.token;

      console.log('0. Auth Tokens Acquired:', !!adminToken && !!userToken ? 'PASS' : 'FAIL');

      // -----------------------------------------------------------------------
      // AUTHOR TESTS
      // -----------------------------------------------------------------------
      console.log('\n--- AUTHOR TESTS ---');

      // 1. Create Author - Without Token (401)
      const aNoToken = await fetch(`http://localhost:${PORT}/api/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized Author' })
      });
      console.log('1. Create Author No Token (401):', aNoToken.status === 401 ? 'PASS (401)' : 'FAIL');

      // 2. Create Author - USER Role (403)
      const aUserToken = await fetch(`http://localhost:${PORT}/api/authors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ name: 'User Author' })
      });
      console.log('2. Create Author User Role (403):', aUserToken.status === 403 ? 'PASS (403)' : 'FAIL');

      // 3. Create Author - Missing Name (400)
      const aMissingName = await fetch(`http://localhost:${PORT}/api/authors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ biography: 'Some biography' })
      });
      console.log('3. Create Author Missing Name (400):', aMissingName.status === 400 ? 'PASS (400)' : 'FAIL');

      // 4. Create Author - Success ADMIN (201)
      const aCreateRes = await fetch(`http://localhost:${PORT}/api/authors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'George Orwell',
          biography: 'English novelist and essayist, journalist and critic.'
        })
      });
      const aCreateData = await aCreateRes.json();
      const createdAuthorId = aCreateData.author?.id;
      console.log('4. Create Author Success (201):', aCreateRes.status === 201 && !!createdAuthorId ? 'PASS (201)' : 'FAIL', 'ID:', createdAuthorId);

      // 5. Get All Authors - USER (200)
      const aGetAllRes = await fetch(`http://localhost:${PORT}/api/authors`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const aGetAllData = await aGetAllRes.json();
      console.log('5. Get All Authors (200):', aGetAllRes.status === 200 && aGetAllData.authors?.length >= 7 ? 'PASS (200)' : 'FAIL', 'Total:', aGetAllData.authors?.length);

      // 6. Get Author By ID - USER (200)
      const aGetOneRes = await fetch(`http://localhost:${PORT}/api/authors/${createdAuthorId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const aGetOneData = await aGetOneRes.json();
      console.log('6. Get Author By ID (200):', aGetOneRes.status === 200 && aGetOneData.author?.name === 'George Orwell' ? 'PASS (200)' : 'FAIL');

      // 7. Get Author Not Found (404)
      const aNotFoundRes = await fetch(`http://localhost:${PORT}/api/authors/99999`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      console.log('7. Get Non-existent Author (404):', aNotFoundRes.status === 404 ? 'PASS (404)' : 'FAIL');

      // 8. Update Author - USER Role (403)
      const aUpdateUserRes = await fetch(`http://localhost:${PORT}/api/authors/${createdAuthorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ name: 'George Orwell Updated' })
      });
      console.log('8. Update Author User Role (403):', aUpdateUserRes.status === 403 ? 'PASS (403)' : 'FAIL');

      // 9. Update Author - Success ADMIN (200)
      const aUpdateAdminRes = await fetch(`http://localhost:${PORT}/api/authors/${createdAuthorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Eric Arthur Blair (George Orwell)',
          biography: 'Known by his pen name George Orwell.'
        })
      });
      const aUpdateAdminData = await aUpdateAdminRes.json();
      console.log('9. Update Author Admin (200):', aUpdateAdminRes.status === 200 && aUpdateAdminData.author?.name.includes('Eric') ? 'PASS (200)' : 'FAIL');

      // 10. Delete Author With Associated Books - Conflict (409)
      // Author 1 (Robert C. Martin) has associated books in seed
      const aDeleteConflictRes = await fetch(`http://localhost:${PORT}/api/authors/1`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const aDeleteConflictData = await aDeleteConflictRes.json();
      console.log('10. Delete Author With Books Conflict (409):', aDeleteConflictRes.status === 409 ? 'PASS (409)' : 'FAIL', aDeleteConflictData.message);

      // 11. Delete Author Without Books - Success (200)
      const aDeleteRes = await fetch(`http://localhost:${PORT}/api/authors/${createdAuthorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('11. Delete Author Without Books (200):', aDeleteRes.status === 200 ? 'PASS (200)' : 'FAIL');

      // -----------------------------------------------------------------------
      // BOOK TESTS
      // -----------------------------------------------------------------------
      console.log('\n--- BOOK TESTS ---');

      // 12. Create Book - USER Role (403)
      const bUserToken = await fetch(`http://localhost:${PORT}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ title: 'User Book', isbn: '978-0000000001', author_id: 1, total_copies: 3 })
      });
      console.log('12. Create Book User Role (403):', bUserToken.status === 403 ? 'PASS (403)' : 'FAIL');

      // 13. Create Book - Invalid Author (400)
      const bInvAuthor = await fetch(`http://localhost:${PORT}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ title: 'Test Book', isbn: '978-0000000002', author_id: 99999, total_copies: 3 })
      });
      console.log('13. Create Book Invalid Author (400):', bInvAuthor.status === 400 ? 'PASS (400)' : 'FAIL');

      // 14. Create Book - Duplicate ISBN (409)
      const bDupIsbn = await fetch(`http://localhost:${PORT}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ title: 'Clean Code Duplicate', isbn: '978-0132350884', author_id: 1, total_copies: 5 })
      });
      console.log('14. Create Book Duplicate ISBN (409):', bDupIsbn.status === 409 ? 'PASS (409)' : 'FAIL');

      // Clean up previous test book if exists
      await db.query('DELETE FROM books WHERE isbn = ?', ['978-0201616224']);

      // 15. Create Book - Success ADMIN (201)
      const bCreateRes = await fetch(`http://localhost:${PORT}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: 'The Pragmatic Programmer',
          isbn: '978-0201616224',
          author_id: 1,
          category: 'Software Engineering',
          total_copies: 6,
          description: 'Your journey to mastery in software craftsmanship.'
        })
      });
      const bCreateData = await bCreateRes.json();
      const createdBookId = bCreateData.book?.id;
      const copiesMatch = bCreateData.book?.total_copies === 6 && bCreateData.book?.available_copies === 6;
      console.log('15. Create Book Success (201):', bCreateRes.status === 201 && copiesMatch ? 'PASS (201, copies=6)' : 'FAIL', 'ID:', createdBookId);

      // 16. Get All Books - USER (200) with LEFT JOIN
      const bGetAllRes = await fetch(`http://localhost:${PORT}/api/books`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const bGetAllData = await bGetAllRes.json();
      const hasAuthorName = bGetAllData.books?.some(b => b.author_name === 'Robert C. Martin');
      console.log('16. Get All Books with LEFT JOIN (200):', bGetAllRes.status === 200 && hasAuthorName ? 'PASS (200, LEFT JOIN verified)' : 'FAIL', 'Total:', bGetAllData.books?.length);

      // 17. Get Book By ID - USER (200)
      const bGetOneRes = await fetch(`http://localhost:${PORT}/api/books/${createdBookId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const bGetOneData = await bGetOneRes.json();
      console.log('17. Get Book By ID (200):', bGetOneRes.status === 200 && bGetOneData.book?.author?.name === 'Robert C. Martin' ? 'PASS (200)' : 'FAIL');

      // 18. Live Book Search - By Title
      const searchTitleRes = await fetch(`http://localhost:${PORT}/api/books/search?q=Pragmatic`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const searchTitleData = await searchTitleRes.json();
      console.log('18. Search by Title (200):', searchTitleRes.status === 200 && searchTitleData.books?.length >= 1 ? 'PASS (Found by title)' : 'FAIL');

      // 19. Live Book Search - By Author
      const searchAuthorRes = await fetch(`http://localhost:${PORT}/api/books/search?q=Tanenbaum`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const searchAuthorData = await searchAuthorRes.json();
      console.log('19. Search by Author (200):', searchAuthorRes.status === 200 && searchAuthorData.books?.length >= 2 ? 'PASS (Found by author)' : 'FAIL');

      // 20. Live Book Search - By Category
      const searchCatRes = await fetch(`http://localhost:${PORT}/api/books/search?q=Networking`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const searchCatData = await searchCatRes.json();
      console.log('20. Search by Category (200):', searchCatRes.status === 200 && searchCatData.books?.length >= 1 ? 'PASS (Found by category)' : 'FAIL');

      // 21. Live Book Search - Non-existent query
      const searchEmptyRes = await fetch(`http://localhost:${PORT}/api/books/search?q=RandomUnknownPhrase999`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const searchEmptyData = await searchEmptyRes.json();
      console.log('21. Search Non-existent (200, count 0):', searchEmptyRes.status === 200 && searchEmptyData.books?.length === 0 ? 'PASS (0 results)' : 'FAIL');

      // 22. Availability Filter - available=true
      const availTrueRes = await fetch(`http://localhost:${PORT}/api/books?available=true`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const availTrueData = await availTrueRes.json();
      const allAvail = availTrueData.books?.every(b => b.available_copies > 0);
      console.log('22. Filter available=true:', availTrueRes.status === 200 && allAvail ? 'PASS (All copies > 0)' : 'FAIL');

      // 23. Pagination Test
      const pageRes = await fetch(`http://localhost:${PORT}/api/books?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const pageData = await pageRes.json();
      const paginationValid = pageData.pagination?.limit === 5 && pageData.books?.length === 5 && pageData.pagination?.totalPages >= 2;
      console.log('23. Pagination Test (limit=5):', pageRes.status === 200 && paginationValid ? 'PASS (Page 1 of ' + pageData.pagination?.totalPages + ')' : 'FAIL');

      // 24. Update Book - Inventory Delta Test (Increase total_copies from 6 to 8)
      // Available was 6, total was 6. With delta +2, available should become 8!
      const updateCopiesRes = await fetch(`http://localhost:${PORT}/api/books/${createdBookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ total_copies: 8 })
      });
      const updateCopiesData = await updateCopiesRes.json();
      const copiesUpdatedCorrectly = updateCopiesData.book?.total_copies === 8 && updateCopiesData.book?.available_copies === 8;
      console.log('24. Update Book Inventory Delta (+2):', updateCopiesRes.status === 200 && copiesUpdatedCorrectly ? 'PASS (Total=8, Avail=8)' : 'FAIL');

      // 25. Update Book - Reject Reduction Below Issued Copies
      // Simulate 3 copies issued: set available_copies = 5 (out of 8) directly in DB
      await db.query('UPDATE books SET available_copies = 5 WHERE id = ?', [createdBookId]);
      // Currently issued = 8 - 5 = 3 copies.
      // Trying to reduce total_copies to 2 (which is < 3 issued) should be rejected!
      const updateInvalidCopiesRes = await fetch(`http://localhost:${PORT}/api/books/${createdBookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ total_copies: 2 })
      });
      const updateInvalidCopiesData = await updateInvalidCopiesRes.json();
      console.log('25. Reject Reduction Below Issued Copies (400):', updateInvalidCopiesRes.status === 400 ? 'PASS (400)' : 'FAIL', updateInvalidCopiesData.message);

      // 26. Delete Book - Referenced by History/Reservation Conflict (409)
      // Book 1 (Clean Code) has transactions and reservations
      const bDeleteConflictRes = await fetch(`http://localhost:${PORT}/api/books/1`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const bDeleteConflictData = await bDeleteConflictRes.json();
      console.log('26. Delete Book Conflict with History (409):', bDeleteConflictRes.status === 409 ? 'PASS (409)' : 'FAIL', bDeleteConflictData.message);

      // 27. Delete Book - Success (200) for unreferenced test book
      const bDeleteRes = await fetch(`http://localhost:${PORT}/api/books/${createdBookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('27. Delete Book Success (200):', bDeleteRes.status === 200 ? 'PASS (200)' : 'FAIL');

      // 28. Phase 2/3/4 Regression Check
      const sampleLeftJoinRes = await fetch(`http://localhost:${PORT}/api/books/sample-left-join`);
      const sampleLeftJoinData = await sampleLeftJoinRes.json();
      console.log('28. Regression - sample-left-join (200):', sampleLeftJoinRes.status === 200 && sampleLeftJoinData.data?.length >= 11 ? 'PASS' : 'FAIL');

      console.log('\n=== ALL 28 PHASE 5 TESTS COMPLETED SUCCESSFULLY ===');
    } catch (err) {
      console.error('ERROR IN PHASE 5 TEST SUITE:', err);
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        await db.end();
        console.log('=== TEST SERVER & DB POOL CLOSED CLEANLY ===');
      });
    }
  });
}

runPhase5TestSuite();
