const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { loadClubById, requireClubCoordinatorOrAdmin } = require('../../middlewares/clubOwnership.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createDriveSchema, listDrivesQuerySchema } = require('./drive.validation');
const driveController = require('./drive.controller');

// mergeParams: true — this router is mounted at /clubs/:clubId/drives,
// and needs access to :clubId from the parent mount path.
const router = express.Router({ mergeParams: true });

// Public — students need to browse open drives without logging in first.
router.get('/', validate(listDrivesQuerySchema), driveController.listDrivesForClub);

// Coordinator (own club) or admin only.
router.post(
  '/',
  protect,
  validate(createDriveSchema),
  loadClubById('clubId'),
  requireClubCoordinatorOrAdmin,
  driveController.createDrive
);

module.exports = router;
