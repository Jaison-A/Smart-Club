const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { optionalAuth } = require('../../middlewares/optionalAuth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { loadClubById, requireClubCoordinatorOrAdmin } = require('../../middlewares/clubOwnership.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createClubSchema,
  updateClubSchema,
  clubIdParamSchema,
  rejectClubSchema,
  assignCoordinatorSchema,
  memberParamSchema,
  listClubsQuerySchema,
} = require('./club.validation');
const clubController = require('./club.controller');
const { inviteMemberSchema, setOfficerTitleSchema } = require('./membershipInvite.validation');
const membershipInviteController = require('./membershipInvite.controller');
const { nestedRouter: coordinatorRequestNestedRouter } = require('./coordinatorRequest.routes');

const router = express.Router();

// --- Public routes ---
router.get('/', optionalAuth, validate(listClubsQuerySchema), clubController.listClubs);
// Must be registered before '/:slug' or 'mine' would be read as a slug.
router.get('/mine', protect, clubController.listMyClubs);
router.get('/:slug', optionalAuth, clubController.getClubBySlug);

// --- Any authenticated user (student, coordinator, or admin) ---
// A student creating a club is promoted to coordinator and the club
// starts 'pending'; an admin creating one is auto-active. See
// club.service.js#createClub for the full rationale.
router.post('/', protect, validate(createClubSchema), clubController.createClub);

// --- Admin only ---
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  validate(clubIdParamSchema),
  clubController.deleteClub
);
router.post(
  '/:id/coordinators',
  protect,
  authorize('admin'),
  validate(assignCoordinatorSchema),
  loadClubById(),
  clubController.assignCoordinator
);
router.delete(
  '/:id/coordinators/:userId',
  protect,
  authorize('admin'),
  validate(memberParamSchema),
  loadClubById(),
  clubController.removeCoordinator
);

// --- Admin only: club approval workflow ---
router.patch(
  '/:id/approve',
  protect,
  authorize('admin'),
  validate(clubIdParamSchema),
  loadClubById(),
  clubController.approveClub
);
router.patch(
  '/:id/reject',
  protect,
  authorize('admin'),
  validate(rejectClubSchema),
  loadClubById(),
  clubController.rejectClub
);
router.patch(
  '/:id/suspend',
  protect,
  authorize('admin'),
  validate(clubIdParamSchema),
  loadClubById(),
  clubController.suspendClub
);
router.patch(
  '/:id/restore',
  protect,
  authorize('admin'),
  validate(clubIdParamSchema),
  loadClubById(),
  clubController.restoreClub
);

// --- Coordinator (own club) or admin ---
router.patch(
  '/:id',
  protect,
  validate(updateClubSchema),
  loadClubById(),
  requireClubCoordinatorOrAdmin,
  clubController.updateClub
);
router.get(
  '/:id/members',
  protect,
  validate(clubIdParamSchema),
  loadClubById(),
  requireClubCoordinatorOrAdmin,
  clubController.getMembers
);
router.post(
  '/:id/members/:userId',
  protect,
  validate(memberParamSchema),
  loadClubById(),
  requireClubCoordinatorOrAdmin,
  clubController.addMember
);
router.delete(
  '/:id/members/:userId',
  protect,
  validate(memberParamSchema),
  loadClubById(),
  requireClubCoordinatorOrAdmin,
  clubController.removeMember
);
router.patch(
  '/:id/members/:userId/title',
  protect,
  validate(setOfficerTitleSchema),
  loadClubById(),
  requireClubCoordinatorOrAdmin,
  clubController.setOfficerTitle
);

// --- Membership invites (admin or coordinator sends a student a direct invite) ---
router.post(
  '/:id/member-invites',
  protect,
  validate(inviteMemberSchema),
  loadClubById(),
  requireClubCoordinatorOrAdmin,
  membershipInviteController.inviteMember
);

// --- Coordinator requests (admin invites staff to coordinate / staff applies) ---
// Mounted with :id (not :clubId) to match this file's param convention --
// the nested router's own validation schemas expect params.id.
router.use('/:id/coordinator-requests', coordinatorRequestNestedRouter);

module.exports = router;
