const Application = require('../models/Application');
const Club = require('../models/Club');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Attaches req.application from :id.
const loadApplicationById = catchAsync(async (req, res, next) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    return next(new AppError('Application not found', 404));
  }
  req.application = application;
  next();
});

// Must run after loadApplicationById. Uses the denormalized `club`
// field on the application rather than going through the drive, since
// it's already indexed there for exactly this purpose.
const loadClubFromApplication = catchAsync(async (req, res, next) => {
  const club = await Club.findById(req.application.club);
  if (!club) {
    return next(new AppError('The club associated with this application no longer exists', 404));
  }
  req.club = club;
  next();
});

// A stricter check than requireClubCoordinatorOrAdmin: the applicant
// themself may also view (but not review/change the status of) their
// own application. Must run after loadApplicationById + loadClubFromApplication.
function requireApplicationViewAccess(req, res, next) {
  if (req.user.role === 'admin') return next();

  const isOwner = req.application.applicant.toString() === req.user._id.toString();
  const isCoordinator = req.club.coordinators.some(
    (coordId) => coordId.toString() === req.user._id.toString()
  );

  if (isOwner || isCoordinator) return next();

  return next(new AppError('You are not authorized to view this application', 403));
}

module.exports = { loadApplicationById, loadClubFromApplication, requireApplicationViewAccess };
