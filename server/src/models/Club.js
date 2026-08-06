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
      enum: ['active', 'pending', 'archived'],
      default: 'pending',
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
