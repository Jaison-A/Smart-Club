const Club = require('../../models/Club');
const Membership = require('../../models/Membership');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const slugify = require('../../utils/slugify');
const notificationService = require('../notifications/notification.service');

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

async function createClub(payload, creator) {
  const slug = await generateUniqueSlug(payload.name);

  // Architecture decision: any authenticated user can create a club
  // (not just admins) — they become its coordinator, and the club
  // starts 'pending' until an admin reviews it. An admin creating a
  // club directly skips review (they don't need to approve themselves)
  // and isn't auto-added as a "coordinator" — admins manage clubs
  // through their role, not by being listed on them.
  const isAdminCreator = creator.role === 'admin';

  const club = await Club.create({
    ...payload,
    slug,
    createdBy: creator._id,
    status: isAdminCreator ? 'active' : 'pending',
    coordinators: isAdminCreator ? [] : [creator._id],
  });

  if (!isAdminCreator && creator.role === 'student') {
    creator.role = 'coordinator';
    await creator.save({ validateBeforeSave: false });
  }

  if (!isAdminCreator) {
    await Membership.create({ club: club._id, user: creator._id, role: 'coordinator' });
  }

  return club;
}

const APPROVABLE_FROM = ['pending', 'rejected'];

// Who to notify about a club-level decision -- its coordinators, or
// its creator if it has no coordinators yet (e.g. an admin-created
// club still awaiting a coordinator invite/application).
function clubStakeholders(club) {
  const ids = club.coordinators?.length ? club.coordinators.map((c) => c.toString()) : [];
  if (club.createdBy && !ids.includes(club.createdBy.toString())) ids.push(club.createdBy.toString());
  return ids;
}

async function approveClub(club) {
  if (!APPROVABLE_FROM.includes(club.status)) {
    throw new AppError(`Cannot approve a club with status '${club.status}'`, 400);
  }
  club.status = 'active';
  club.rejectionReason = '';
  await club.save();

  await notificationService.notifyMany(clubStakeholders(club), {
    type: 'club_approved',
    message: `"${club.name}" has been approved and is now live.`,
    link: `/clubs/${club.slug}`,
  });

  return club;
}

async function rejectClub(club, reason) {
  if (club.status !== 'pending') {
    throw new AppError(`Cannot reject a club with status '${club.status}' — only pending clubs can be rejected`, 400);
  }
  club.status = 'rejected';
  club.rejectionReason = reason || '';
  await club.save();

  await notificationService.notifyMany(clubStakeholders(club), {
    type: 'club_rejected',
    message: `"${club.name}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
    link: '',
  });

  return club;
}

async function suspendClub(club) {
  if (club.status !== 'active') {
    throw new AppError(`Cannot suspend a club with status '${club.status}' — only active clubs can be suspended`, 400);
  }
  club.status = 'suspended';
  await club.save();
  return club;
}

async function restoreClub(club) {
  if (club.status !== 'suspended') {
    throw new AppError(`Cannot restore a club with status '${club.status}' — only suspended clubs can be restored`, 400);
  }
  club.status = 'active';
  await club.save();
  return club;
}

async function listClubs({ category, tag, search, status, page = 1, limit = 20 }) {
  const filter = {};
  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  // status=all (admin-only, enforced in the controller) means "no status
  // filter". Otherwise listings default to active clubs only, so pending/
  // rejected/suspended clubs never reach the public directory.
  if (status && status !== 'all') filter.status = status;
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

// Every club the user coordinates, in ANY status -- a coordinator whose club
// is still pending/rejected/suspended must still be able to manage it (the
// public list only ever returns active clubs).
async function listMyClubs(userId) {
  return Club.find({ coordinators: userId }).sort({ createdAt: -1 });
}

async function getClubBySlug(slug, requestingUser) {
  const club = await Club.findOne({ slug }).populate('coordinators', 'name email avatarUrl');
  if (!club) {
    throw new AppError('Club not found', 404);
  }

  if (club.status !== 'active') {
    const isAdmin = requestingUser?.role === 'admin';
    const isOwnCoordinator = requestingUser
      ? club.coordinators.some((c) => c._id.toString() === requestingUser._id.toString())
      : false;

    // 404, not 403 -- a stranger shouldn't be able to tell a pending/
    // rejected/suspended club exists at all just by guessing a slug.
    if (!isAdmin && !isOwnCoordinator) {
      throw new AppError('Club not found', 404);
    }
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

  // Stepping down shouldn't leave a stale 'coordinator' membership role
  // behind; they stay on as a regular member.
  await Membership.updateOne({ club: club._id, user: userId, role: 'coordinator' }, { $set: { role: 'member' } });

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

// Sets a member's display position (President/VP/Treasurer/etc). An
// empty string clears it back to a regular member. This does NOT
// touch `role` (the internal member/core/coordinator permission
// tier) -- a title is cosmetic-plus-event-rights, not a security
// boundary on its own (see eventOfficerCheck for how it's actually used).
async function setOfficerTitle(clubId, userId, officerTitle) {
  const membership = await Membership.findOne({ club: clubId, user: userId, status: 'active' });
  if (!membership) {
    throw new AppError('Active membership not found for this user in this club', 404);
  }
  membership.officerTitle = officerTitle;
  await membership.save();
  return membership;
}

module.exports = {
  createClub,
  approveClub,
  rejectClub,
  suspendClub,
  restoreClub,
  listClubs,
  getClubBySlug,
  listMyClubs,
  updateClub,
  deleteClub,
  assignCoordinator,
  removeCoordinator,
  getMembers,
  addMember,
  removeMember,
  setOfficerTitle,
};
