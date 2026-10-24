const Notification = require('../../models/Notification');

// Called by other services (applications, events, clubs, coordinator
// requests, certificates) to fan out a notification. Intentionally
// fire-and-forget from the caller's perspective -- a notification
// failing to write should never fail the action that triggered it, so
// callers await this but don't need to handle its errors specially
// (it only throws on a genuine DB failure, which is already surfaced
// by the global error handler either way).
async function notify(userId, { type, message, link = '' }) {
  return Notification.create({ user: userId, type, message, link });
}

// Same as notify(), but for a list of recipients at once -- used when
// an event is created and every active club member should hear about
// it. insertMany is one round trip instead of N.
async function notifyMany(userIds, { type, message, link = '' }) {
  if (!userIds.length) return [];
  const docs = userIds.map((userId) => ({ user: userId, type, message, link }));
  return Notification.insertMany(docs);
}

async function listForUser(userId, { unreadOnly, page = 1, limit = 20 } = {}) {
  const filter = { user: userId };
  if (unreadOnly === 'true') filter.read = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, read: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  };
}

async function markRead(notificationId, userId) {
  // Scoped to the requesting user in the query itself (not just
  // checked after fetching) -- a user can never mark someone else's
  // notification as read, and a not-found/not-yours case looks
  // identical from the outside.
  await Notification.updateOne({ _id: notificationId, user: userId }, { $set: { read: true } });
}

async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
}

module.exports = { notify, notifyMany, listForUser, markRead, markAllRead };
