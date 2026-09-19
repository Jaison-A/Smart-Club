const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    certificateType: {
      type: String,
      enum: ['participation', 'achievement'],
      default: 'participation',
    },
    // Human-shareable unique ID, distinct from the Mongo _id, used in
    // the public verification URL — short and doesn't leak DB internals.
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// A student gets at most one certificate per event.
certificateSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
