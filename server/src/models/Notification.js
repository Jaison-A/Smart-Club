const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Free-form type tag (e.g. 'application_status', 'event_created',
    // 'coordinator_invite', 'club_approved') -- used by the frontend to
    // pick an icon, not enforced as an enum, so new notification kinds
    // can be added without a migration.
    type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Frontend route to navigate to when the notification is clicked
    // (e.g. "/events/<id>"). Optional -- some notifications are purely
    // informational.
    link: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
