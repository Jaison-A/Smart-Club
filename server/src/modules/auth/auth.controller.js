const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');
const authService = require('./auth.service');

// Refresh tokens live in an httpOnly cookie — inaccessible to JS in the
// browser, which mitigates XSS-based token theft. The access token is
// returned in the JSON body and kept in memory on the client instead.
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

const register = catchAsync(async (req, res) => {
  const user = await authService.registerUser(req.body);
  return success(res, 201, { user }, 'Account created successfully');
});

const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  return success(res, 200, { user, accessToken }, 'Logged in successfully');
});

const refresh = catchAsync(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const { user, accessToken, refreshToken } = await authService.refreshAccessToken(incomingToken);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  return success(res, 200, { user, accessToken }, 'Token refreshed');
});

const logout = catchAsync(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (req.user) {
    await authService.logoutUser(req.user._id, incomingToken);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  return success(res, 200, null, 'Logged out successfully');
});

const getMe = catchAsync(async (req, res) => {
  return success(res, 200, { user: req.user }, 'Current user fetched');
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  return success(res, 200, null, 'Password changed successfully. Please log in again.');
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  return success(res, 200, { user }, 'Profile updated successfully');
});

const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No image file was uploaded', 400));
  // Served statically at /uploads (see app.js) from the dir multer wrote to.
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const user = await authService.updateAvatar(req.user._id, avatarUrl);
  return success(res, 200, { user }, 'Profile picture updated successfully');
});

module.exports = { register, login, refresh, logout, getMe, changePassword, updateProfile, uploadAvatar };
