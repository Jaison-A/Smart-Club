/**
 * Smoke test for auth building blocks that don't require a live DB
 * connection: password hashing, JWT sign/verify, and Zod validation.
 * Run with: node scripts/smoke-test.js
 */
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/smart_club_platform';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const bcrypt = require('bcryptjs');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} = require('../src/utils/tokens');
const { registerSchema, loginSchema } = require('../src/modules/auth/auth.validation');

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`PASS: ${label}`);
    passed++;
  } else {
    console.log(`FAIL: ${label}`);
    failed++;
  }
}

async function run() {
  // 1. Password hashing
  const plain = 'SuperSecret123';
  const hash = await bcrypt.hash(plain, 12);
  check('password hash is not equal to plaintext', hash !== plain);
  check('bcrypt.compare validates correct password', await bcrypt.compare(plain, hash));
  check('bcrypt.compare rejects wrong password', !(await bcrypt.compare('wrong', hash)));

  // 2. JWT access/refresh tokens
  const fakeUser = { _id: { toString: () => '64f000000000000000000001' }, role: 'student' };
  const accessToken = generateAccessToken(fakeUser);
  const refreshToken = generateRefreshToken(fakeUser);

  const decodedAccess = verifyAccessToken(accessToken);
  check('access token decodes with correct userId', decodedAccess.userId === '64f000000000000000000001');
  check('access token carries role', decodedAccess.role === 'student');

  const decodedRefresh = verifyRefreshToken(refreshToken);
  check('refresh token decodes with correct userId', decodedRefresh.userId === '64f000000000000000000001');
  check('refresh token does NOT carry role', decodedRefresh.role === undefined);

  check('hashToken is deterministic', hashToken(refreshToken) === hashToken(refreshToken));
  check('hashToken differs for different tokens', hashToken(accessToken) !== hashToken(refreshToken));

  // 3. Zod validation schemas
  const validRegister = registerSchema.safeParse({
    body: { name: 'Jaison', email: 'jaison@sxcce.edu', password: 'password123' },
  });
  check('valid register payload passes', validRegister.success === true);

  const invalidRegister = registerSchema.safeParse({
    body: { name: 'J', email: 'not-an-email', password: '123' },
  });
  check('invalid register payload fails', invalidRegister.success === false);

  const validLogin = loginSchema.safeParse({
    body: { email: 'jaison@sxcce.edu', password: 'password123' },
  });
  check('valid login payload passes', validLogin.success === true);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
