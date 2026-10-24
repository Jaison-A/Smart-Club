const mongoose = require('mongoose');

const coordinatorRequestSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // 'invite': an admin proposed `user` as coordinator; `user` accepts/rejects.
    // 'application': `user` proposed themself; an admin accepts/rejects.
    // Same lifecycle either way -- who initiated it and who resolves it
    // just flips, which is exactly why one model covers both.
    direction: {
      type: String,
      enum: ['invite', 'application'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    // Who sent the invite (admin) -- null for an application, since the
    // applicant and `user` are the same person there.
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// A user can only have one *pending* request per club at a time --
// enforced in the service layer (a partial unique index would be
// cleaner but adds Mongo-version-specific syntax; the service check is
// simple and sufficient at this scale).
coordinatorRequestSchema.index({ club: 1, user: 1, status: 1 });

module.exports = mongoose.model('CoordinatorRequest', coordinatorRequestSchema);
