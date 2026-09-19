const User = require('../../models/User');
const AppError = require('../../utils/AppError');

async function listUsers({ role, search, isActive, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  };
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function setUserRole(userId, role) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.role = role;
  await user.save({ validateBeforeSave: false });
  return user;
}

async function setUserActive(userId, isActive) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.isActive = isActive;
  // Disabling a user should also kill any live sessions immediately —
  // otherwise their existing access token stays valid until it expires.
  if (!isActive) {
    user.refreshTokens = [];
  }
  await user.save({ validateBeforeSave: false });
  return user;
}

module.exports = { listUsers, getUserById, setUserRole, setUserActive };
