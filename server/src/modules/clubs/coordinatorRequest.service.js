const CoordinatorRequest = require('../../models/CoordinatorRequest');
const Club = require('../../models/Club');
const User = require('../../models/User');
const Membership = require('../../models/Membership');
const AppError = require('../../utils/AppError');
const notificationService = require('../notifications/notification.service');

async function assertNoPendingRequest(clubId, userId) {
  const existing = await CoordinatorRequest.findOne({ club: clubId, user: userId, status: 'pending' });
  if (existing) {
    throw new AppError('There is already a pending coordinator request for this user and club', 409);
  }
}

// Admin invites a specific user to coordinate a club.
async function inviteCoordinator(clubId, userId, adminId, message) {
  const club = await Club.findById(clubId);
  if (!club) throw new AppError('Club not found', 404);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const alreadyCoordinator = club.coordinators.some((id) => id.toString() === userId);
  if (alreadyCoordinator) {
    throw new AppError('This user is already a coordinator of this club', 409);
  }

  await assertNoPendingRequest(clubId, userId);

  const request = await CoordinatorRequest.create({
    club: clubId,
    user: userId,
    direction: 'invite',
    invitedBy: adminId,
    message,
  });

  await notificationService.notify(userId, {
    type: 'coordinator_invite',
    message: `You've been invited to coordinate "${club.name}".`,
    link: `/coordinator-requests`,
  });

  return request;
}

// A staff/student applies to coordinate a club that has no coordinator yet.
async function applyToCoordinate(clubId, userId) {
  const club = await Club.findById(clubId);
  if (!club) throw new AppError('Club not found', 404);

  if (club.coordinators.length > 0) {
    throw new AppError('This club already has a coordinator', 400);
  }

  await assertNoPendingRequest(clubId, userId);

  const request = await CoordinatorRequest.create({
    club: clubId,
    user: userId,
    direction: 'application',
  });

  return request;
}

async function promoteToCoordinator(club, userId) {
  club.coordinators.push(userId);
  await club.save();

  const user = await User.findById(userId);
  if (user && user.role === 'student') {
    user.role = 'coordinator';
    await user.save({ validateBeforeSave: false });
  }

  await Membership.findOneAndUpdate(
    { club: club._id, user: userId },
    { role: 'coordinator', status: 'active' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// Resolving an invite: only the invited user may accept/reject it.
// Resolving an application: only an admin may accept/reject it.
// Enforced by the caller (route/controller knows which role is
// calling); this just executes the state transition.
async function resolveRequest(request, resolution) {
  if (request.status !== 'pending') {
    throw new AppError(`This request has already been ${request.status}`, 400);
  }

  request.status = resolution;
  request.resolvedAt = new Date();
  await request.save();

  if (resolution === 'accepted') {
    const club = await Club.findById(request.club);
    if (!club) throw new AppError('Club no longer exists', 404);
    await promoteToCoordinator(club, request.user.toString());

    if (request.direction === 'application') {
      await notificationService.notify(request.user, {
        type: 'coordinator_application_accepted',
        message: `Your application to coordinate "${club.name}" was accepted.`,
        link: `/clubs/${club.slug}`,
      });
    }
  } else if (resolution === 'rejected' && request.direction === 'application') {
    const club = await Club.findById(request.club);
    await notificationService.notify(request.user, {
      type: 'coordinator_application_rejected',
      message: `Your application to coordinate "${club?.name || 'a club'}" was not accepted.`,
      link: '',
    });
  }

  return request;
}

async function listForClub(clubId) {
  return CoordinatorRequest.find({ club: clubId }).populate('user', 'name email').sort({ createdAt: -1 });
}

async function listForUser(userId) {
  return CoordinatorRequest.find({ user: userId, direction: 'invite' })
    .populate('club', 'name slug')
    .sort({ createdAt: -1 });
}

async function listApplications() {
  return CoordinatorRequest.find({ direction: 'application', status: 'pending' })
    .populate('user', 'name email')
    .populate('club', 'name slug')
    .sort({ createdAt: -1 });
}

module.exports = {
  inviteCoordinator,
  applyToCoordinate,
  resolveRequest,
  listForClub,
  listForUser,
  listApplications,
};
