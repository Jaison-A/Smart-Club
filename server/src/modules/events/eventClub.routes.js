const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { loadClubById, requireClubCoordinatorOrAdmin } = require('../../middlewares/clubOwnership.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createEventSchema, listEventsQuerySchema } = require('./event.validation');
const eventController = require('./event.controller');

const router = express.Router({ mergeParams: true });

router.get('/', validate(listEventsQuerySchema), eventController.listEventsForClub);

router.post(
  '/',
  protect,
  validate(createEventSchema),
  loadClubById('clubId'),
  requireClubCoordinatorOrAdmin,
  eventController.createEvent
);

module.exports = router;
