const crypto = require('crypto');
const AttendanceSession = require('../../models/AttendanceSession');
const AttendanceLog = require('../../models/AttendanceLog');
const EventRegistration = require('../../models/EventRegistration');
const Event = require('../../models/Event');
const AppError = require('../../utils/AppError');

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes -- short enough that a code shared after class ends is useless

function generateCode() {
  // Short enough to type manually as a fallback, random enough not to
  // be guessable within its 5-minute window.
  return crypto.randomBytes(6).toString('hex');
}

async function createSession(eventId, creatorId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);
  if (event.status === 'cancelled') {
    throw new AppError('Cannot generate attendance for a cancelled event', 400);
  }

  const session = await AttendanceSession.create({
    event: eventId,
    code: generateCode(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    createdBy: creatorId,
  });

  return session;
}

async function markAttendance(code, userId) {
  const session = await AttendanceSession.findOne({ code });
  if (!session) {
    throw new AppError('Invalid attendance code', 400);
  }
  if (session.expiresAt < new Date()) {
    throw new AppError('This attendance code has expired. Ask your coordinator to generate a new one.', 400);
  }

  // Requirement: only a student registered for the event can mark attendance.
  const registration = await EventRegistration.findOne({
    event: session.event,
    user: userId,
    status: 'registered',
  });
  if (!registration) {
    throw new AppError('You must be registered for this event to mark attendance', 403);
  }

  try {
    const log = await AttendanceLog.create({
      session: session._id,
      event: session.event,
      user: userId,
      method: 'qr',
    });
    return log;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Attendance has already been marked for this event', 409);
    }
    throw err;
  }
}

async function markManualAttendance(eventId, userId) {
  const registration = await EventRegistration.findOne({ event: eventId, user: userId, status: 'registered' });
  if (!registration) {
    throw new AppError('This student is not registered for the event', 400);
  }

  try {
    const log = await AttendanceLog.create({ event: eventId, user: userId, method: 'manual' });
    return log;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Attendance has already been marked for this event', 409);
    }
    throw err;
  }
}

async function listAttendanceForEvent(eventId) {
  const logs = await AttendanceLog.find({ event: eventId })
    .populate('user', 'name email department year')
    .sort({ scannedAt: -1 });
  return logs;
}

module.exports = { createSession, markAttendance, markManualAttendance, listAttendanceForEvent };
