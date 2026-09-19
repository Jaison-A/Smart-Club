const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const { requireClubCoordinatorOrAdmin } = require('../../middlewares/clubOwnership.middleware');
const { loadEventById, loadClubFromEvent } = require('../../middlewares/eventOwnership.middleware');
const validate = require('../../middlewares/validate.middleware');
const { updateEventSchema, eventIdParamSchema, markAttendanceSchema } = require('./event.validation');
const eventController = require('./event.controller');
const attendanceController = require('./attendance.controller');
const certificateController = require('../certificates/certificate.controller');
const {
  eventIdParamSchema: certEventIdParamSchema,
  generateForAttendeeSchema,
} = require('../certificates/certificate.validation');

const router = express.Router();

// --- Public ---
router.get('/:eventId', validate(eventIdParamSchema), eventController.getEvent);

// --- Coordinator (own club) or admin ---
const requireEventOwnership = [loadEventById, loadClubFromEvent, requireClubCoordinatorOrAdmin];

router.patch('/:eventId', protect, validate(updateEventSchema), ...requireEventOwnership, eventController.updateEvent);
router.delete('/:eventId', protect, validate(eventIdParamSchema), ...requireEventOwnership, eventController.cancelEvent);
router.get(
  '/:eventId/registrations',
  protect,
  validate(eventIdParamSchema),
  ...requireEventOwnership,
  eventController.listRegistrationsForEvent
);

// --- Students: registration ---
router.post('/:eventId/register', protect, validate(eventIdParamSchema), eventController.registerForEvent);
router.delete('/:eventId/register', protect, validate(eventIdParamSchema), eventController.cancelRegistration);

// --- Attendance (QR) ---
router.post(
  '/:eventId/attendance/session',
  protect,
  validate(eventIdParamSchema),
  ...requireEventOwnership,
  attendanceController.createSession
);
router.post('/:eventId/attendance/scan', protect, validate(markAttendanceSchema), attendanceController.markAttendance);
router.post(
  '/:eventId/attendance/manual/:userId',
  protect,
  ...requireEventOwnership,
  attendanceController.markManualAttendance
);
router.get(
  '/:eventId/attendance/logs',
  protect,
  validate(eventIdParamSchema),
  ...requireEventOwnership,
  attendanceController.listAttendanceForEvent
);

// --- Certificates ---
router.post(
  '/:eventId/certificates/generate-all',
  protect,
  validate(certEventIdParamSchema),
  loadEventById,
  loadClubFromEvent,
  requireClubCoordinatorOrAdmin,
  certificateController.generateForAllAttendees
);
router.post(
  '/:eventId/certificates/:userId',
  protect,
  validate(generateForAttendeeSchema),
  loadEventById,
  loadClubFromEvent,
  requireClubCoordinatorOrAdmin,
  certificateController.generateForAttendee
);

module.exports = router;
