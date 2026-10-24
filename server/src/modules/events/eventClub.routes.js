const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { loadClubById, requireClubOfficerCoordinatorOrAdmin } = require('../../middlewares/clubOwnership.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createEventSchema, listEventsQuerySchema } = require('./event.validation');
const eventController = require('./event.controller');

const router = express.Router({ mergeParams: true });

router.get('/', validate(listEventsQuerySchema), eventController.listEventsForClub);

// Coordinator, admin, or a club officer (President/VP/etc, per
// membership.officerTitle) may organize an event.
router.post(
  '/',
  protect,
  validate(createEventSchema),
  loadClubById('clubId'),
  requireClubOfficerCoordinatorOrAdmin,
  eventController.createEvent
);

module.exports = router;
