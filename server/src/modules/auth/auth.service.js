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

// Login identifier may be an email or a register number (studentId). A
// register number is only honoured when it matches exactly ONE account --
// studentId isn't unique, and silently picking one of several matches
// would be a security problem.
async function findLoginUser(identifier) {
  const value = String(identifier).trim();
  if (value.includes('@')) {
    return User.findOne({ email: value.toLowerCase() }).select('+password +refreshTokens');
  }
  const matches = await User.find({ studentId: value }).select('+password +refreshTokens').limit(2);
  return matches.length === 1 ? matches[0] : null;
}

async function loginUser({ email, password }) {
  const user = await findLoginUser(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been disabled. Contact an administrator.', 403);
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

  const hashed = hashToken(refreshToken);

  // Atomic check-and-remove: the filter requires `hashed` to still be in
  // the array and $pull removes it in the same operation. If two requests
  // race on one token (React StrictMode double-effect, two tabs), only ONE
  // can match-and-pull; the other gets null and correctly fails, instead of
  // both reading a stale copy and one whole-array save clobbering the other.
  const user = await User.findOneAndUpdate(
    { _id: decoded.userId, refreshTokens: hashed },
    { $pull: { refreshTokens: hashed } },
    { new: true }
  ).select('+refreshTokens');

  if (!user) {
    throw new AppError('Refresh token is no longer valid. Please log in again.', 401);
  }

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

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password +refreshTokens');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword; // pre('save') hook re-hashes it
  // Changing the password invalidates every other session -- if an
  // account was compromised, this is the point where old sessions
  // (including an attacker's) should stop working.
  user.refreshTokens = [];
  await user.save();
}

const ALLOWED_PROFILE_FIELDS = [
  'name', 'department', 'year', 'skills', 'interests',
  'bio', 'github', 'linkedin', 'website', 'resumeUrl',
];

async function updateProfile(userId, updates) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  // Only allow-listed fields are ever assigned (defence in depth on top of
  // Zod stripping unknown keys) -- role/password/email can't be smuggled in.
  ALLOWED_PROFILE_FIELDS.forEach((field) => {
    if (updates[field] !== undefined) user[field] = updates[field];
  });
  await user.save({ validateBeforeSave: false });
  return user;
}

async function updateAvatar(userId, avatarUrl) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.avatarUrl = avatarUrl;
  await user.save({ validateBeforeSave: false });
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changePassword,
  updateProfile,
  updateAvatar,
};
