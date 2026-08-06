const Club = require('../models/Club');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Fetches the club referenced by req.params[paramName] and attaches it
// as req.club. Parameterized so both /clubs/:id/... routes and nested
// routes like /clubs/:clubId/drives can reuse the same logic.
function loadClubById(paramName = 'id') {
  return catchAsync(async (req, res, next) => {
    const club = await Club.findById(req.params[paramName]);
    if (!club) {
      return next(new AppError('Club not found', 404));
    }
    req.club = club;
    next();
  });
}

// Must run after `protect` and `loadClubById`. Admins can act on any
// club; coordinators can only act on clubs they're assigned to — this
// is the "own club" ownership check referenced in the RBAC matrix.
function requireClubCoordinatorOrAdmin(req, res, next) {
  if (req.user.role === 'admin') return next();

  const isCoordinator = req.club.coordinators.some(
    (coordId) => coordId.toString() === req.user._id.toString()
  );

  if (req.user.role === 'coordinator' && isCoordinator) return next();

  return next(new AppError('You are not authorized to manage this club', 403));
}

module.exports = { loadClubById, requireClubCoordinatorOrAdmin };
