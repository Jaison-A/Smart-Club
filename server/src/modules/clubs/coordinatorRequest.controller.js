const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const AppError = require('../../utils/AppError');
const CoordinatorRequest = require('../../models/CoordinatorRequest');
const coordinatorRequestService = require('./coordinatorRequest.service');

const inviteCoordinator = catchAsync(async (req, res) => {
  const request = await coordinatorRequestService.inviteCoordinator(
    req.params.id,
    req.body.userId,
    req.user._id,
    req.body.message
  );
  return success(res, 201, { request }, 'Coordinator invitation sent');
});

const applyToCoordinate = catchAsync(async (req, res) => {
  const request = await coordinatorRequestService.applyToCoordinate(req.params.id, req.user._id);
  return success(res, 201, { request }, 'Application submitted. An admin will review it.');
});

const listForClub = catchAsync(async (req, res) => {
  const requests = await coordinatorRequestService.listForClub(req.params.id);
  return success(res, 200, { requests }, 'Requests fetched successfully');
});

// A user's own incoming invites.
const listMyInvites = catchAsync(async (req, res) => {
  const requests = await coordinatorRequestService.listForUser(req.user._id);
  return success(res, 200, { requests }, 'Invites fetched successfully');
});

// Admin's queue of pending applications across all clubs.
const listApplications = catchAsync(async (req, res) => {
  const requests = await coordinatorRequestService.listApplications();
  return success(res, 200, { requests }, 'Applications fetched successfully');
});

// Handles both directions from one endpoint since they share the same
// resource and lifecycle -- only the authorization rule differs:
// an INVITE may only be resolved by the invited user themself;
// an APPLICATION may only be resolved by an admin.
const respondToRequest = catchAsync(async (req, res, next) => {
  const request = await CoordinatorRequest.findById(req.params.requestId);
  if (!request) return next(new AppError('Request not found', 404));

  if (request.direction === 'invite') {
    if (request.user.toString() !== req.user._id.toString()) {
      return next(new AppError('This invite was not sent to you', 403));
    }
  } else if (req.user.role !== 'admin') {
    return next(new AppError('Only an admin can resolve a coordinator application', 403));
  }

  const resolution = req.params.action === 'accept' ? 'accepted' : 'rejected';
  const updated = await coordinatorRequestService.resolveRequest(request, resolution);
  return success(res, 200, { request: updated }, `Request ${resolution}`);
});

module.exports = {
  inviteCoordinator,
  applyToCoordinate,
  listForClub,
  listMyInvites,
  listApplications,
  respondToRequest,
};
