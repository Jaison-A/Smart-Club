const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize, requireSelfOrAdmin } = require('../../middlewares/rbac.middleware');
const validate = require('../../middlewares/validate.middleware');
const { userIdParamSchema } = require('../recruitment/application.validation');
const applicationController = require('../recruitment/application.controller');
const eventController = require('../events/event.controller');
const certificateController = require('../certificates/certificate.controller');
const User = require('../../models/User');
const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');

const router = express.Router();

// Coordinator/admin only -- used by invite pickers (coordinator
// invites, officer/member invites) to find a user by name or email
// without exposing the full user list the way /admin/users does.
router.get(
  '/search',
  protect,
  authorize('coordinator', 'admin'),
  catchAsync(async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return success(res, 200, { users: [] }, 'Query too short');
    }
    const users = await User.find({
      $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }],
      isActive: true,
    })
      .select('name email role')
      .limit(10);
    return success(res, 200, { users }, 'Users fetched successfully');
  })
);

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

router.get(
  '/:id/events',
  protect,
  validate(userIdParamSchema),
  requireSelfOrAdmin('id'),
  eventController.listMyEvents
);

router.get(
  '/:id/certificates',
  protect,
  validate(userIdParamSchema),
  requireSelfOrAdmin('id'),
  certificateController.listMyCertificates
);

module.exports = router;
