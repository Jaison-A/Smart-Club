const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const eventService = require('./event.service');

const createEvent = catchAsync(async (req, res) => {
  const event = await eventService.createEvent(req.params.clubId, req.body, req.user._id);
  return success(res, 201, { event }, 'Event created successfully');
});

const listEventsForClub = catchAsync(async (req, res) => {
  const result = await eventService.listEventsForClub(req.params.clubId, req.query);
  return success(res, 200, result, 'Events fetched successfully');
});

const getEvent = catchAsync(async (req, res) => {
  const event = await eventService.getEventById(req.params.eventId);
  return success(res, 200, { event }, 'Event fetched successfully');
});

const updateEvent = catchAsync(async (req, res) => {
  const event = await eventService.updateEvent(req.event, req.body);
  return success(res, 200, { event }, 'Event updated successfully');
});

const cancelEvent = catchAsync(async (req, res) => {
  const event = await eventService.cancelEvent(req.event);
  return success(res, 200, { event }, 'Event cancelled successfully');
});

const registerForEvent = catchAsync(async (req, res) => {
  const registration = await eventService.registerForEvent(req.params.eventId, req.user._id);
  return success(res, 201, { registration }, 'Registered for event successfully');
});

const cancelRegistration = catchAsync(async (req, res) => {
  const registration = await eventService.cancelRegistration(req.params.eventId, req.user._id);
  return success(res, 200, { registration }, 'Registration cancelled successfully');
});

const listRegistrationsForEvent = catchAsync(async (req, res) => {
  const result = await eventService.listRegistrationsForEvent(req.params.eventId, req.query);
  return success(res, 200, result, 'Registrations fetched successfully');
});

const listMyEvents = catchAsync(async (req, res) => {
  const result = await eventService.listEventsForUser(req.params.id, req.query);
  return success(res, 200, result, 'Events fetched successfully');
});

module.exports = {
  createEvent,
  listEventsForClub,
  getEvent,
  updateEvent,
  cancelEvent,
  registerForEvent,
  cancelRegistration,
  listRegistrationsForEvent,
  listMyEvents,
};
