const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const membershipInviteService = require('./membershipInvite.service');

const inviteMember = catchAsync(async (req, res) => {
  const invite = await membershipInviteService.inviteMember(
    req.params.id,
    req.body.userId,
    req.body.officerTitle,
    req.user._id
  );
  return success(res, 201, { invite }, 'Invite sent');
});

const listMyInvites = catchAsync(async (req, res) => {
  const invites = await membershipInviteService.listForUser(req.user._id);
  return success(res, 200, { invites }, 'Invites fetched successfully');
});

const acceptInvite = catchAsync(async (req, res) => {
  const invite = await membershipInviteService.respondToInvite(req.params.inviteId, req.user._id, 'accepted');
  return success(res, 200, { invite }, 'Invite accepted');
});

const rejectInvite = catchAsync(async (req, res) => {
  const invite = await membershipInviteService.respondToInvite(req.params.inviteId, req.user._id, 'rejected');
  return success(res, 200, { invite }, 'Invite rejected');
});

module.exports = { inviteMember, listMyInvites, acceptInvite, rejectInvite };
