const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      maxlength: 100,
    },
    // Slugs are generated server-side from `name` (see club.service.js) —
    // never accepted directly from the request body, so a client can't
    // set an arbitrary or colliding slug.
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    vision: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    mission: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    coverImageUrl: {
      type: String,
      default: '',
    },
    // Shown on the club page; required by the creation form per the design
    // ("Must have a faculty advisor").
    facultyAdvisor: {
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      designation: { type: String, trim: true, default: '' },
    },
    coordinators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Used by the skill-based recommendation engine to match against
    // a student's `skills`/`interests` fields on the User model.
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'suspended', 'archived'],
      default: 'pending',
    },
    // Set by an admin when rejecting a pending club, so the creator
    // knows what to fix before resubmitting (re-approval just flips
    // status back to 'active', it doesn't require a new club).
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    // Denormalized counter kept in sync by the membership service —
    // avoids a COUNT query on the memberships collection every time a
    // club card is rendered in a list.
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

clubSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Club', clubSchema);
