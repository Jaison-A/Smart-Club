const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../../utils/tokens');

async function registerUser({ name, email, password, studentId, department, year }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  // role is deliberately NOT accepted from the request body here —
  // every self-registered account is a student. Coordinators/Admins
  // are created through a separate, protected admin-only flow.
  const user = await User.create({
    name,
    email,
    password,
    studentId,
    department,
    year,
    role: 'student',
  });

  return user;
}

async function issueTokenPair(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store only the hash, and cap stored tokens per user to avoid
  // unbounded growth if a user logs in from many devices without
  // ever logging out.
  const hashed = hashToken(refreshToken);
  user.refreshTokens = [...(user.refreshTokens || []), hashed].slice(-5);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh token missing', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  const hashed = hashToken(refreshToken);
  if (!user.refreshTokens.includes(hashed)) {
    // Token isn't in the stored list — either it was already rotated
    // out (reused old token) or the user logged out. Treat as a
    // potential replay and reject.
    throw new AppError('Refresh token is no longer valid. Please log in again.', 401);
  }

  // Rotate: remove the used token, issue a brand new pair.
  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  const tokens = await issueTokenPair(user);

  return { user, ...tokens };
}

async function logoutUser(userId, refreshToken) {
  if (!refreshToken) return;

  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;

  const hashed = hashToken(refreshToken);
  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  await user.save({ validateBeforeSave: false });
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
