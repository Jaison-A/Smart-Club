const User = require('../../models/User');
const Membership = require('../../models/Membership');
const Application = require('../../models/Application');
const Certificate = require('../../models/Certificate');
const EventRegistration = require('../../models/EventRegistration');
const Club = require('../../models/Club');
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

// Everything an admin needs to understand one user at a glance, fetched in parallel.
async function getUserOverview(id) {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);

  const [memberships, applications, registrationCount, certificateCount, coordinatingClubs] = await Promise.all([
    Membership.find({ user: id, status: 'active' }).populate('club', 'name slug status'),
    Application.find({ applicant: id })
      .populate('drive', 'title')
      .populate('club', 'name slug')
      .sort({ submittedAt: -1 })
      .limit(20),
    EventRegistration.countDocuments({ user: id, status: 'registered' }),
    Certificate.countDocuments({ user: id }),
    Club.find({ coordinators: id }).select('name slug status'),
  ]);

  return { user, memberships, applications, registrationCount, certificateCount, coordinatingClubs };
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

module.exports = { listUsers, getUserById, getUserOverview, setUserRole, setUserActive };
