const MembershipInvite = require('../../models/MembershipInvite');
const Membership = require('../../models/Membership');
const Club = require('../../models/Club');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const notificationService = require('../notifications/notification.service');

async function inviteMember(clubId, userId, officerTitle, inviterId) {
  const club = await Club.findById(clubId);
  if (!club) throw new AppError('Club not found', 404);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const existingMembership = await Membership.findOne({ club: clubId, user: userId, status: 'active' });
  if (existingMembership) {
    throw new AppError('This user is already an active member of this club', 409);
  }

  const existingInvite = await MembershipInvite.findOne({ club: clubId, user: userId, status: 'pending' });
  if (existingInvite) {
    throw new AppError('There is already a pending invite for this user', 409);
  }

  const invite = await MembershipInvite.create({
    club: clubId,
    user: userId,
    officerTitle: officerTitle || '',
    invitedBy: inviterId,
  });

  await notificationService.notify(userId, {
    type: 'membership_invite',
    message: officerTitle
      ? `You've been invited to join "${club.name}" as ${officerTitle}.`
      : `You've been invited to join "${club.name}".`,
    link: '/invites',
  });

  return invite;
}

async function respondToInvite(inviteId, userId, resolution) {
  const invite = await MembershipInvite.findById(inviteId);
  if (!invite) throw new AppError('Invite not found', 404);
  if (invite.user.toString() !== userId.toString()) {
    throw new AppError('This invite was not sent to you', 403);
  }
  if (invite.status !== 'pending') {
    throw new AppError(`This invite has already been ${invite.status}`, 400);
  }

  invite.status = resolution;
  await invite.save();

  if (resolution === 'accepted') {
    const existing = await Membership.findOne({ club: invite.club, user: userId });
    if (existing) {
      existing.status = 'active';
      existing.officerTitle = invite.officerTitle;
      existing.joinedAt = new Date();
      await existing.save();
    } else {
      await Membership.create({ club: invite.club, user: userId, officerTitle: invite.officerTitle });
    }
    await Club.findByIdAndUpdate(invite.club, { $inc: { memberCount: 1 } });
  }

  return invite;
}

async function listForUser(userId) {
  return MembershipInvite.find({ user: userId, status: 'pending' }).populate('club', 'name slug').sort({ createdAt: -1 });
}

module.exports = { inviteMember, respondToInvite, listForUser };
