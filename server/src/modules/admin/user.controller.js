const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const AppError = require('../../utils/AppError');
const userService = require('./user.service');

const listUsers = catchAsync(async (req, res) => {
  const result = await userService.listUsers(req.query);
  return success(res, 200, result, 'Users fetched successfully');
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return success(res, 200, { user }, 'User fetched successfully');
});

const setRole = catchAsync(async (req, res, next) => {
  // An admin demoting/promoting themselves out of the admin role could
  // lock the platform out of admin access entirely if they're the only
  // one — block self-modification here rather than trusting the UI to
  // prevent it.
  if (req.params.id === req.user._id.toString()) {
    return next(new AppError('You cannot change your own role', 400));
  }
  const user = await userService.setUserRole(req.params.id, req.body.role);
  return success(res, 200, { user }, 'User role updated successfully');
});

const disableUser = catchAsync(async (req, res, next) => {
  if (req.params.id === req.user._id.toString()) {
    return next(new AppError('You cannot disable your own account', 400));
  }
  const user = await userService.setUserActive(req.params.id, false);
  return success(res, 200, { user }, 'User disabled successfully');
});

const enableUser = catchAsync(async (req, res) => {
  const user = await userService.setUserActive(req.params.id, true);
  return success(res, 200, { user }, 'User enabled successfully');
});

module.exports = { listUsers, getUser, setRole, disableUser, enableUser };
