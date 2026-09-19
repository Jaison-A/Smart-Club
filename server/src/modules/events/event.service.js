const Event = require('../../models/Event');
const EventRegistration = require('../../models/EventRegistration');
const AppError = require('../../utils/AppError');

async function createEvent(clubId, payload, creatorId) {
  const event = await Event.create({ ...payload, club: clubId, createdBy: creatorId });
  return event;
}

async function listEventsForClub(clubId, { status, page = 1, limit = 20 } = {}) {
  const filter = { club: clubId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(filter).skip(skip).limit(Number(limit)).sort({ startTime: -1 }),
    Event.countDocuments(filter),
  ]);

  return { events, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
}

async function getEventById(eventId) {
  const event = await Event.findById(eventId).populate('club', 'name slug logoUrl');
  if (!event) throw new AppError('Event not found', 404);
  return event;
}

async function updateEvent(event, updates) {
  Object.assign(event, updates);
  await event.save();
  return event;
}

async function cancelEvent(event) {
  event.status = 'cancelled';
  await event.save();
  return event;
}

async function registerForEvent(eventId, userId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);

  if (event.status === 'cancelled') {
    throw new AppError('This event has been cancelled', 400);
  }
  if (!event.registrationRequired) {
    throw new AppError('This event does not require registration', 400);
  }

  const existing = await EventRegistration.findOne({ event: eventId, user: userId });
  if (existing && existing.status === 'registered') {
    throw new AppError('You are already registered for this event', 409);
  }

  if (event.capacity > 0) {
    const activeCount = await EventRegistration.countDocuments({ event: eventId, status: 'registered' });
    if (activeCount >= event.capacity) {
      throw new AppError('This event is at full capacity', 400);
    }
  }

  let registration;
  if (existing) {
    existing.status = 'registered';
    existing.registeredAt = new Date();
    registration = await existing.save();
  } else {
    try {
      registration = await EventRegistration.create({ event: eventId, user: userId });
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError('You are already registered for this event', 409);
      }
      throw err;
    }
  }

  return registration;
}

async function cancelRegistration(eventId, userId) {
  const registration = await EventRegistration.findOne({ event: eventId, user: userId, status: 'registered' });
  if (!registration) {
    throw new AppError('You are not registered for this event', 404);
  }
  registration.status = 'cancelled';
  await registration.save();
  return registration;
}

async function listRegistrationsForEvent(eventId, { page = 1, limit = 50 } = {}) {
  const skip = (Number(page) - 1) * Number(limit);
  const [registrations, total] = await Promise.all([
    EventRegistration.find({ event: eventId, status: 'registered' })
      .populate('user', 'name email department year avatarUrl')
      .skip(skip)
      .limit(Number(limit))
      .sort({ registeredAt: -1 }),
    EventRegistration.countDocuments({ event: eventId, status: 'registered' }),
  ]);
  return { registrations, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
}

async function listEventsForUser(userId, { page = 1, limit = 20 } = {}) {
  const skip = (Number(page) - 1) * Number(limit);
  const [registrations, total] = await Promise.all([
    EventRegistration.find({ user: userId, status: 'registered' })
      .populate({ path: 'event', populate: { path: 'club', select: 'name slug logoUrl' } })
      .skip(skip)
      .limit(Number(limit))
      .sort({ registeredAt: -1 }),
    EventRegistration.countDocuments({ user: userId, status: 'registered' }),
  ]);
  return { registrations, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
}

module.exports = {
  createEvent,
  listEventsForClub,
  getEventById,
  updateEvent,
  cancelEvent,
  registerForEvent,
  cancelRegistration,
  listRegistrationsForEvent,
  listEventsForUser,
};
