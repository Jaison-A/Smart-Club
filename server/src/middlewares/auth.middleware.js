const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

// Protects a route: requires a valid, unexpired access token.
// On success, attaches the authenticated user document to req.user
// so downstream controllers/middlewares can rely on it.
const protect = catchAsync(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh your session.', 401));
    }
    return next(new AppError('Invalid access token.', 401));
  }

  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (!currentUser.isActive) {
    return next(new AppError('This account has been disabled. Contact an administrator.', 403));
  }

  req.user = currentUser;
  next();
});

module.exports = { protect };
