const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { requireClubCoordinatorOrAdmin } = require('../../middlewares/clubOwnership.middleware');
const {
  loadApplicationById,
  loadClubFromApplication,
  requireApplicationViewAccess,
} = require('../../middlewares/applicationOwnership.middleware');
const validate = require('../../middlewares/validate.middleware');
const { applicationIdParamSchema, updateApplicationStatusSchema } = require('./application.validation');
const applicationController = require('./application.controller');

const router = express.Router();

// Applicant themself, or coordinator/admin of the owning club.
router.get(
  '/:id',
  protect,
  validate(applicationIdParamSchema),
  loadApplicationById,
  loadClubFromApplication,
  requireApplicationViewAccess,
  applicationController.getApplication
);

// Coordinator (own club) or admin only — reviewing/deciding is not
// something the applicant can do to their own application.
router.patch(
  '/:id/status',
  protect,
  validate(updateApplicationStatusSchema),
  loadApplicationById,
  loadClubFromApplication,
  requireClubCoordinatorOrAdmin,
  applicationController.updateApplicationStatus
);

module.exports = router;
