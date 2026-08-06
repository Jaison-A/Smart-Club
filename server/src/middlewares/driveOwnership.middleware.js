const RecruitmentDrive = require('../models/RecruitmentDrive');
const Club = require('../models/Club');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Attaches req.drive from :driveId.
const loadDriveById = catchAsync(async (req, res, next) => {
  const drive = await RecruitmentDrive.findById(req.params.driveId);
  if (!drive) {
    return next(new AppError('Recruitment drive not found', 404));
  }
  req.drive = drive;
  next();
});

// Must run after loadDriveById. Attaches req.club so the existing
// requireClubCoordinatorOrAdmin middleware can be reused unchanged —
// ownership of a drive is defined by ownership of its parent club.
const loadClubFromDrive = catchAsync(async (req, res, next) => {
  const club = await Club.findById(req.drive.club);
  if (!club) {
    return next(new AppError('The club associated with this drive no longer exists', 404));
  }
  req.club = club;
  next();
});

module.exports = { loadDriveById, loadClubFromDrive };
