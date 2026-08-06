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
