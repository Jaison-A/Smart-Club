const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

// For routes that are public by default but behave differently for a
// logged-in user (e.g. a club's own coordinator seeing their pending
// club, where a stranger would get 404). Never rejects the request —
// worst case req.user simply stays unset.
const optionalAuth = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const decoded = verifyAccessToken(authHeader.split(' ')[1]);
    const user = await User.findById(decoded.userId);
    if (user?.isActive) req.user = user;
  } catch {
    // Invalid/expired token on an optional-auth route just means
    // "treat as anonymous" -- not an error worth surfacing here.
  }
  next();
});

module.exports = { optionalAuth };
