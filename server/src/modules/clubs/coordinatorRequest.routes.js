const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  inviteCoordinatorSchema,
  clubIdParamSchema,
  requestIdParamSchema,
} = require('./coordinatorRequest.validation');
const controller = require('./coordinatorRequest.controller');

// Nested under /clubs/:id/coordinator-requests
const nestedRouter = express.Router({ mergeParams: true });
nestedRouter.post(
  '/invite',
  protect,
  authorize('admin'),
  validate(inviteCoordinatorSchema),
  controller.inviteCoordinator
);
nestedRouter.post('/apply', protect, validate(clubIdParamSchema), controller.applyToCoordinate);
nestedRouter.get('/', protect, authorize('admin'), validate(clubIdParamSchema), controller.listForClub);

// Standalone /coordinator-requests
const router = express.Router();
router.get('/mine', protect, controller.listMyInvites);
router.get('/applications', protect, authorize('admin'), controller.listApplications);

router.patch(
  '/:requestId/accept',
  protect,
  validate(requestIdParamSchema),
  (req, res, next) => {
    req.params.action = 'accept';
    next();
  },
  controller.respondToRequest
);
router.patch(
  '/:requestId/reject',
  protect,
  validate(requestIdParamSchema),
  (req, res, next) => {
    req.params.action = 'reject';
    next();
  },
  controller.respondToRequest
);

module.exports = { nestedRouter, router };
