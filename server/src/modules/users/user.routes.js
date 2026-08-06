const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { requireSelfOrAdmin } = require('../../middlewares/rbac.middleware');
const validate = require('../../middlewares/validate.middleware');
const { userIdParamSchema } = require('../recruitment/application.validation');
const applicationController = require('../recruitment/application.controller');

const router = express.Router();

// A student can view their own application history; an admin can view
// anyone's. Coordinators get no special access here — they review
// applications to their club via /drives/:driveId/applications instead.
router.get(
  '/:id/applications',
  protect,
  validate(userIdParamSchema),
  requireSelfOrAdmin('id'),
  applicationController.listMyApplications
);

module.exports = router;
