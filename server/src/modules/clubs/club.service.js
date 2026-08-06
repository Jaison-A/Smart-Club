const Club = require('../../models/Club');
const Membership = require('../../models/Membership');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const slugify = require('../../utils/slugify');

// Appends a numeric suffix on collision (e.g. "robotics-club-2") instead
// of failing outright — keeps club creation friction-free for admins.
async function generateUniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;

  // eslint-disable-next-line no-await-in-loop
  while (await Club.exists({ slug })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

async function createClub(payload, creatorId) {
  const slug = await generateUniqueSlug(payload.name);

  const club = await Club.create({
    ...payload,
    slug,
    createdBy: creatorId,
    status: 'pending', // new clubs start pending until an admin activates them
  });

  return club;
}

async function listClubs({ category, tag, search, status, page = 1, limit = 20 }) {
  const filter = {};
  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (status) filter.status = status;
  // Public listings default to active clubs only, so pending/archived
  // clubs don't show up in the directory unless explicitly requested
  // (e.g. by an admin filtering status=pending).
  if (!status) filter.status = 'active';
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);

  const [clubs, total] = await Promise.all([
    Club.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Club.countDocuments(filter),
  ]);

  return {
    clubs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

async function getClubBySlug(slug) {
  const club = await Club.findOne({ slug }).populate('coordinators', 'name email avatarUrl');
  if (!club) {
    throw new AppError('Club not found', 404);
  }
  return club;
}

async function updateClub(club, updates) {
  // Renaming a club doesn't change its slug — slugs are meant to be
  // stable, shareable URLs. A separate "change slug" flow would be a
  // deliberate admin action, not a side effect of an edit.
  Object.assign(club, updates);
  await club.save();
  return club;
}

async function deleteClub(clubId) {
  const club = await Club.findById(clubId);
  if (!club) {
    throw new AppError('Club not found', 404);
  }
  await Membership.deleteMany({ club: clubId });
  await club.deleteOne();
}

async function assignCoordinator(club, userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const alreadyCoordinator = club.coordinators.some((id) => id.toString() === userId);
  if (alreadyCoordinator) {
    throw new AppError('User is already a coordinator of this club', 409);
  }

  club.coordinators.push(userId);
  await club.save();

  // Promote the user's account role so their JWT (on next login/refresh)
  // grants them coordinator-level route access platform-wide.
  if (user.role === 'student') {
    user.role = 'coordinator';
    await user.save({ validateBeforeSave: false });
  }

  // Ensure they also have an active membership record marked as coordinator.
  await Membership.findOneAndUpdate(
    { club: club._id, user: userId },
    { role: 'coordinator', status: 'active' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return club;
}

async function removeCoordinator(club, userId) {
  const isCoordinator = club.coordinators.some((id) => id.toString() === userId);
  if (!isCoordinator) {
    throw new AppError('User is not a coordinator of this club', 404);
  }

  club.coordinators = club.coordinators.filter((id) => id.toString() !== userId);
  await club.save();

  return club;
}

async function getMembers(clubId, { status = 'active', page = 1, limit = 20 } = {}) {
  const skip = (Number(page) - 1) * Number(limit);

  const [members, total] = await Promise.all([
    Membership.find({ club: clubId, status })
      .populate('user', 'name email avatarUrl department year')
      .skip(skip)
      .limit(Number(limit))
      .sort({ joinedAt: -1 }),
    Membership.countDocuments({ club: clubId, status }),
  ]);

  return {
    members,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  };
}

async function addMember(clubId, userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const existing = await Membership.findOne({ club: clubId, user: userId });

  if (existing && existing.status === 'active') {
    throw new AppError('User is already an active member of this club', 409);
  }

  let membership;
  if (existing) {
    // Re-joining after having left — reactivate rather than duplicate.
    existing.status = 'active';
    existing.joinedAt = new Date();
    membership = await existing.save();
  } else {
    membership = await Membership.create({ club: clubId, user: userId });
  }

  await Club.findByIdAndUpdate(clubId, { $inc: { memberCount: 1 } });

  return membership;
}

async function removeMember(clubId, userId) {
  const membership = await Membership.findOne({ club: clubId, user: userId, status: 'active' });
  if (!membership) {
    throw new AppError('Active membership not found for this user in this club', 404);
  }

  membership.status = 'removed';
  await membership.save();

  await Club.findByIdAndUpdate(clubId, { $inc: { memberCount: -1 } });

  return membership;
}

module.exports = {
  createClub,
  listClubs,
  getClubBySlug,
  updateClub,
  deleteClub,
  assignCoordinator,
  removeCoordinator,
  getMembers,
  addMember,
  removeMember,
};
