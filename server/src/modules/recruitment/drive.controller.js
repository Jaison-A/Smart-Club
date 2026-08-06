const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const driveService = require('./drive.service');

const createDrive = catchAsync(async (req, res) => {
  const drive = await driveService.createDrive(req.params.clubId, req.body, req.user._id);
  return success(res, 201, { drive }, 'Recruitment drive created successfully');
});

const listDrivesForClub = catchAsync(async (req, res) => {
  const result = await driveService.listDrivesForClub(req.params.clubId, req.query);
  return success(res, 200, result, 'Drives fetched successfully');
});

const getDrive = catchAsync(async (req, res) => {
  const drive = await driveService.getDriveById(req.params.driveId);
  return success(res, 200, { drive }, 'Drive fetched successfully');
});

// req.drive is already loaded (and ownership already checked) by
// loadDriveById + loadClubFromDrive + requireClubCoordinatorOrAdmin.
const updateDrive = catchAsync(async (req, res) => {
  const drive = await driveService.updateDrive(req.drive, req.body);
  return success(res, 200, { drive }, 'Drive updated successfully');
});

module.exports = { createDrive, listDrivesForClub, getDrive, updateDrive };
