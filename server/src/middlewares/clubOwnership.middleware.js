const Club = require('../models/Club');
const Membership = require('../models/Membership');
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

// Broader than requireClubCoordinatorOrAdmin: also lets in an active
// member who holds an officer position (officerTitle is non-empty --
// e.g. President, VP, Treasurer). Used specifically for event
// creation, where "certain roles and coordinators can organize an
// event" is the actual requirement -- not for editing/cancelling
// events or other club-management actions, which stay
// coordinator/admin-only via requireClubCoordinatorOrAdmin.
const requireClubOfficerCoordinatorOrAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') return next();

  const isCoordinator = req.club.coordinators.some(
    (coordId) => coordId.toString() === req.user._id.toString()
  );
  if (isCoordinator) return next();

  const membership = await Membership.findOne({
    club: req.club._id,
    user: req.user._id,
    status: 'active',
  });
  if (membership?.officerTitle) return next();

  return next(new AppError('You are not authorized to organize events for this club', 403));
});

module.exports = { loadClubById, requireClubCoordinatorOrAdmin, requireClubOfficerCoordinatorOrAdmin };
