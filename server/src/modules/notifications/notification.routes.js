const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const notificationController = require('./notification.controller');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.listMyNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
