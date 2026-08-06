const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    value: { type: String, default: '' },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentDrive',
      required: true,
    },
    // Denormalized from drive.club — saves a join/populate on every
    // authorization check (loading the application is enough to find
    // which club's coordinators are allowed to review it).
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    responses: {
      type: [responseSchema],
      default: [],
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['submitted', 'shortlisted', 'interview', 'accepted', 'rejected'],
      default: 'submitted',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One application per student per drive — resubmission isn't supported
// in this phase; a rejected applicant would need a new drive to reapply.
applicationSchema.index({ drive: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ club: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
