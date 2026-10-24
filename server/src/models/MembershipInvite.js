const mongoose = require('mongoose');

const membershipInviteSchema = new mongoose.Schema(
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
    // The position they're being invited into -- empty string means a
    // regular member, otherwise a title like "President"/"Treasurer".
    officerTitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipInvite', membershipInviteSchema);
