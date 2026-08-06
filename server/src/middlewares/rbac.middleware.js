const AppError = require('../utils/AppError');

// Usage: router.post('/clubs', protect, authorize('admin'), createClub)
// Must run AFTER `protect`, since it relies on req.user being set.
function authorize(...allowedRoles) {
  return function checkRole(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required before authorization can be checked.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not permitted to perform this action.`, 403)
      );
    }

    next();
  };
}

// Usage: router.get('/:id/applications', protect, requireSelfOrAdmin('id'), handler)
// Allows a user to act on their own resource, or an admin to act on anyone's.
function requireSelfOrAdmin(paramName = 'id') {
  return function checkSelfOrAdmin(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (req.user.role === 'admin' || req.user._id.toString() === req.params[paramName]) {
      return next();
    }

    return next(new AppError('You are not authorized to access this resource.', 403));
  };
}

module.exports = { authorize, requireSelfOrAdmin };
