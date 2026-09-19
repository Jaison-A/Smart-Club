const Event = require('../models/Event');
const Club = require('../models/Club');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const loadEventById = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId || req.params.id);
  if (!event) {
    return next(new AppError('Event not found', 404));
  }
  req.event = event;
  next();
});

const loadClubFromEvent = catchAsync(async (req, res, next) => {
  const club = await Club.findById(req.event.club);
  if (!club) {
    return next(new AppError('The club associated with this event no longer exists', 404));
  }
  req.club = club;
  next();
});

module.exports = { loadEventById, loadClubFromEvent };
