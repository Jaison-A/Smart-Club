const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const notificationService = require('./notification.service');

const listMyNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.listForUser(req.user._id, req.query);
  return success(res, 200, result, 'Notifications fetched successfully');
});

const markRead = catchAsync(async (req, res) => {
  await notificationService.markRead(req.params.id, req.user._id);
  return success(res, 200, null, 'Notification marked as read');
});

const markAllRead = catchAsync(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  return success(res, 200, null, 'All notifications marked as read');
});

module.exports = { listMyNotifications, markRead, markAllRead };
