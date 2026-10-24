const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
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
    role: {
      type: String,
      enum: ['member', 'core', 'coordinator'],
      default: 'member',
    },
    // Free-text display position (e.g. "President", "Vice President",
    // "Treasurer") set by the coordinator. Separate from `role`, which
    // is the internal permission tier -- an officer's actual
    // permissions (e.g. being able to post events) are derived from
    // `officerTitle` being non-empty, not from this string's exact
    // value, so clubs aren't locked into a fixed title list.
    officerTitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
    },
    status: {
      type: String,
      enum: ['active', 'left', 'removed'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A user can only have one membership record per club — re-joining after
// leaving updates the existing record rather than creating a duplicate.
membershipSchema.index({ club: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Membership', membershipSchema);
