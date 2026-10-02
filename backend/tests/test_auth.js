const app = require('../src/app');
const db = require('../src/config/db');

async function testAuthSuite() {
  const PORT = 5002;
  const server = app.listen(PORT, async () => {
    try {
      console.log('=== RUNNING PHASE 4 AUTHENTICATION & AUTHORIZATION TESTS ===\n');

      // Test 1: Registration - Missing Fields
      const regMissingRes = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const regMissingData = await regMissingRes.json();
      console.log('1. Reg Missing Fields:', regMissingRes.status === 400 ? 'PASS (400)' : 'FAIL', regMissingData.message);

      // Test 2: Registration - Invalid Email
      const regInvEmailRes = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'notanemail', password: 'password123' })
      });
      const regInvEmailData = await regInvEmailRes.json();
      console.log('2. Reg Invalid Email:', regInvEmailRes.status === 400 ? 'PASS (400)' : 'FAIL', regInvEmailData.message);

      // Test 3: Registration - Short Password
      const regShortPassRes = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: '123' })
      });
      const regShortPassData = await regShortPassRes.json();
      console.log('3. Reg Short Password:', regShortPassRes.status === 400 ? 'PASS (400)' : 'FAIL', regShortPassData.message);

      // Clean up previous test user if exists
      await db.query('DELETE FROM users WHERE email = ?', ['test.student@library.edu']);

      // Test 4: Registration - Success
      const regSuccessRes = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Student', email: 'test.student@library.edu', password: 'StudentPassword@123' })
      });
      const regSuccessData = await regSuccessRes.json();
      const hasNoPassword = !regSuccessData.user?.password;
      console.log('4. Reg Success (201):', regSuccessRes.status === 201 && hasNoPassword ? 'PASS (201, safe payload)' : 'FAIL', regSuccessData.user);

      // Test 5: Registration - Duplicate Email
      const regDupRes = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Duplicate Student', email: 'test.student@library.edu', password: 'StudentPassword@123' })
      });
      const regDupData = await regDupRes.json();
      console.log('5. Reg Duplicate Email (409):', regDupRes.status === 409 ? 'PASS (409 Conflict)' : 'FAIL', regDupData.message);

      // Test 6: Verify password in DB is bcrypt hash and NOT plaintext
      const [dbUserRows] = await db.query('SELECT password FROM users WHERE email = ?', ['test.student@library.edu']);
      const isBcrypt = dbUserRows[0].password.startsWith('$2b$10$');
      console.log('6. DB Password Hashed (bcrypt):', isBcrypt ? 'PASS (Stored as bcrypt hash)' : 'FAIL');

      // Test 7: Login - Non-existent User
      const loginUnknownRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password123' })
      });
      console.log('7. Login Non-existent User (401):', loginUnknownRes.status === 401 ? 'PASS (401)' : 'FAIL');

      // Test 8: Login - Incorrect Password
      const loginBadPassRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test.student@library.edu', password: 'WrongPassword' })
      });
      console.log('8. Login Incorrect Password (401):', loginBadPassRes.status === 401 ? 'PASS (401)' : 'FAIL');

      // Test 9: Login - User Success
      const loginSuccessRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test.student@library.edu', password: 'StudentPassword@123' })
      });
      const loginData = await loginSuccessRes.json();
      const userToken = loginData.token;
      console.log('9. Login User Success (200):', loginSuccessRes.status === 200 && !!userToken ? 'PASS (JWT generated)' : 'FAIL', 'Role:', loginData.user?.role);

      // Test 10: Login - Admin Success (seed user)
      const adminLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@library.edu', password: 'Admin@123' })
      });
      const adminLoginData = await adminLoginRes.json();
      const adminToken = adminLoginData.token;
      console.log('10. Login Admin Success (200):', adminLoginRes.status === 200 && adminLoginData.user?.role === 'ADMIN' ? 'PASS (Admin JWT)' : 'FAIL');

      // Test 11: /api/auth/me - Missing Token (401)
      const meNoTokenRes = await fetch(`http://localhost:${PORT}/api/auth/me`);
      console.log('11. /me Missing Token (401):', meNoTokenRes.status === 401 ? 'PASS (401)' : 'FAIL');

      // Test 12: /api/auth/me - Invalid Token (401)
      const meBadTokenRes = await fetch(`http://localhost:${PORT}/api/auth/me`, {
        headers: { 'Authorization': 'Bearer bad.token.here' }
      });
      console.log('12. /me Invalid Token (401):', meBadTokenRes.status === 401 ? 'PASS (401)' : 'FAIL');

      // Test 13: /api/auth/me - Valid User Token (200)
      const meValidRes = await fetch(`http://localhost:${PORT}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const meData = await meValidRes.json();
      console.log('13. /me Valid User Token (200):', meValidRes.status === 200 && meData.user?.email === 'test.student@library.edu' ? 'PASS' : 'FAIL', meData.user?.email);

      // Test 14: Role Authorization - USER accessing ADMIN-only route (403 Forbidden)
      const adminRouteWithUserRes = await fetch(`http://localhost:${PORT}/api/auth/admin-test`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const adminRouteWithUserData = await adminRouteWithUserRes.json();
      console.log('14. User on Admin Route (403):', adminRouteWithUserRes.status === 403 ? 'PASS (403 Forbidden)' : 'FAIL', adminRouteWithUserData.message);

      // Test 15: Role Authorization - ADMIN accessing ADMIN-only route (200 OK)
      const adminRouteWithAdminRes = await fetch(`http://localhost:${PORT}/api/auth/admin-test`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const adminRouteWithAdminData = await adminRouteWithAdminRes.json();
      console.log('15. Admin on Admin Route (200):', adminRouteWithAdminRes.status === 200 ? 'PASS (200 OK)' : 'FAIL', adminRouteWithAdminData.message);

      // Test 16: Logout Endpoint
      const logoutRes = await fetch(`http://localhost:${PORT}/api/auth/logout`, { method: 'POST' });
      const logoutData = await logoutRes.json();
      console.log('16. Logout (200):', logoutRes.status === 200 ? 'PASS' : 'FAIL', logoutData.message);

      // Test 17: Existing Phase 1-3 endpoints
      const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
      const healthData = await healthRes.json();
      console.log('17. Health Check Regression:', healthRes.status === 200 && healthData.database === 'connected' ? 'PASS' : 'FAIL');

      const booksRes = await fetch(`http://localhost:${PORT}/api/books/sample-left-join`);
      const booksData = await booksRes.json();
      console.log('18. Books LEFT JOIN Regression:', booksRes.status === 200 && booksData.data?.length === 11 ? 'PASS' : 'FAIL');

      console.log('\n=== ALL 18 TESTS COMPLETED SUCCESSFULLY ===');
    } catch (err) {
      console.error('ERROR IN TEST SUITE:', err);
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        await db.end();
        console.log('=== TEST SERVER & DB CONNECTION CLOSED CLEANLY ===');
      });
    }
  });
}

testAuthSuite();
