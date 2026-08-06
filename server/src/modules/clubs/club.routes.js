const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');
const { loadClubById, requireClubCoordinatorOrAdmin } = require('../../middlewares/clubOwnership.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createClubSchema,
  updateClubSchema,
  clubIdParamSchema,
  assignCoordinatorSchema,
  memberParamSchema,
  listClubsQuerySchema,
} = require('./club.validation');
const clubController = require('./club.controller');

const router = express.Router();

// --- Public routes ---
router.get('/', validate(listClubsQuerySchema), clubController.listClubs);
router.get('/:slug', clubController.getClubBySlug);

// --- Admin only ---
router.post('/', protect, authorize('admin'), validate(createClubSchema), clubController.createClub);
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

module.exports = router;
