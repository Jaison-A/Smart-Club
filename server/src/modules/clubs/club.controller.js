const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const AppError = require('../../utils/AppError');
const clubService = require('./club.service');

const createClub = catchAsync(async (req, res) => {
  const club = await clubService.createClub(req.body, req.user);
  return success(res, 201, { club }, 'Club submitted successfully. It will be reviewed by an admin shortly.');
});

const approveClub = catchAsync(async (req, res) => {
  const club = await clubService.approveClub(req.club);
  return success(res, 200, { club }, 'Club approved');
});

const rejectClub = catchAsync(async (req, res) => {
  const club = await clubService.rejectClub(req.club, req.body.reason);
  return success(res, 200, { club }, 'Club rejected');
});

const suspendClub = catchAsync(async (req, res) => {
  const club = await clubService.suspendClub(req.club);
  return success(res, 200, { club }, 'Club suspended');
});

const restoreClub = catchAsync(async (req, res) => {
  const club = await clubService.restoreClub(req.club);
  return success(res, 200, { club }, 'Club restored');
});

const listClubs = catchAsync(async (req, res, next) => {
  // Anyone can browse active clubs (the default). Querying any other
  // status (pending/rejected/suspended) exposes clubs that aren't
  // meant to be publicly visible yet -- restrict that to admins, who
  // are the only ones who need a cross-club view of non-active clubs.
  // A coordinator sees their own pending/suspended club through their
  // dashboard, not this endpoint.
  if (req.query.status && req.query.status !== 'active' && req.user?.role !== 'admin') {
    return next(new AppError('Only admins can filter clubs by this status', 403));
  }
  const result = await clubService.listClubs(req.query);
  return success(res, 200, result, 'Clubs fetched successfully');
});

const getClubBySlug = catchAsync(async (req, res) => {
  const club = await clubService.getClubBySlug(req.params.slug, req.user);
  return success(res, 200, { club }, 'Club fetched successfully');
});

// req.club is already loaded (and ownership already checked) by
// loadClubById + requireClubCoordinatorOrAdmin before this runs.
const updateClub = catchAsync(async (req, res) => {
  const club = await clubService.updateClub(req.club, req.body);
  return success(res, 200, { club }, 'Club updated successfully');
});

const deleteClub = catchAsync(async (req, res) => {
  await clubService.deleteClub(req.params.id);
  return success(res, 200, null, 'Club deleted successfully');
});

const assignCoordinator = catchAsync(async (req, res) => {
  const club = await clubService.assignCoordinator(req.club, req.body.userId);
  return success(res, 200, { club }, 'Coordinator assigned successfully');
});

const removeCoordinator = catchAsync(async (req, res) => {
  const club = await clubService.removeCoordinator(req.club, req.params.userId);
  return success(res, 200, { club }, 'Coordinator removed successfully');
});

const getMembers = catchAsync(async (req, res) => {
  const result = await clubService.getMembers(req.params.id, req.query);
  return success(res, 200, result, 'Members fetched successfully');
});

const addMember = catchAsync(async (req, res) => {
  const membership = await clubService.addMember(req.params.id, req.params.userId);
  return success(res, 201, { membership }, 'Member added successfully');
});

const removeMember = catchAsync(async (req, res) => {
  const membership = await clubService.removeMember(req.params.id, req.params.userId);
  return success(res, 200, { membership }, 'Member removed successfully');
});

module.exports = {
  createClub,
  approveClub,
  rejectClub,
  suspendClub,
  restoreClub,
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
