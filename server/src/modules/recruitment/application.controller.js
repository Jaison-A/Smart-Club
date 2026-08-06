const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const applicationService = require('./application.service');

const submitApplication = catchAsync(async (req, res) => {
  const application = await applicationService.submitApplication(
    req.params.driveId,
    req.user._id,
    req.body
  );
  return success(res, 201, { application }, 'Application submitted successfully');
});

const listApplicationsForDrive = catchAsync(async (req, res) => {
  const result = await applicationService.listApplicationsForDrive(req.params.driveId, req.query);
  return success(res, 200, result, 'Applications fetched successfully');
});

// req.application already loaded + access already checked by
// loadApplicationById + loadClubFromApplication + requireApplicationViewAccess.
const getApplication = catchAsync(async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.id);
  return success(res, 200, { application }, 'Application fetched successfully');
});

const updateApplicationStatus = catchAsync(async (req, res) => {
  const application = await applicationService.updateApplicationStatus(
    req.application,
    req.body,
    req.user._id
  );
  return success(res, 200, { application }, 'Application status updated successfully');
});

const listMyApplications = catchAsync(async (req, res) => {
  const result = await applicationService.listApplicationsForUser(req.params.id, req.query);
  return success(res, 200, result, 'Applications fetched successfully');
});

module.exports = {
  submitApplication,
  listApplicationsForDrive,
  getApplication,
  updateApplicationStatus,
  listMyApplications,
};
