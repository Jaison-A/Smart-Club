const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { requireClubCoordinatorOrAdmin } = require('../../middlewares/clubOwnership.middleware');
const { loadDriveById, loadClubFromDrive } = require('../../middlewares/driveOwnership.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  updateDriveSchema,
  driveIdParamSchema,
  listApplicationsForDriveQuerySchema,
} = require('./drive.validation');
const { submitApplicationSchema } = require('./application.validation');
const driveController = require('./drive.controller');
const applicationController = require('./application.controller');

const router = express.Router();

// Public — drive detail page.
router.get('/:driveId', validate(driveIdParamSchema), driveController.getDrive);

// Coordinator (own club) or admin.
router.patch(
  '/:driveId',
  protect,
  validate(updateDriveSchema),
  loadDriveById,
  loadClubFromDrive,
  requireClubCoordinatorOrAdmin,
  driveController.updateDrive
);

// Students only — coordinators/admins don't apply to drives.
router.post(
  '/:driveId/apply',
  protect,
  authorize('student'),
  validate(submitApplicationSchema),
  applicationController.submitApplication
);

// Coordinator (own club) or admin — review queue for this drive.
router.get(
  '/:driveId/applications',
  protect,
  validate(listApplicationsForDriveQuerySchema),
  loadDriveById,
  loadClubFromDrive,
  requireClubCoordinatorOrAdmin,
  applicationController.listApplicationsForDrive
);

module.exports = router;
