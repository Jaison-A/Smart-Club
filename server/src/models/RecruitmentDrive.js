const mongoose = require('mongoose');

// Defines one field of the drive's dynamic application form. Kept as a
// subdocument array rather than a separate collection since form fields
// have no independent lifecycle — they only ever exist as part of a drive.
const formFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'select', 'url'],
      default: 'text',
    },
    required: { type: Boolean, default: true },
    // Only meaningful when type === 'select'.
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const recruitmentDriveSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Drive title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    formFields: {
      type: [formFieldSchema],
      default: [],
    },
    openDate: {
      type: Date,
      required: true,
    },
    closeDate: {
      type: Date,
      required: true,
    },
    // Explicit, coordinator-controlled status rather than something
    // derived purely from dates — lets a coordinator manually close a
    // drive early (e.g. once enough applications come in) without
    // waiting for closeDate to pass.
    status: {
      type: String,
      enum: ['upcoming', 'open', 'closed'],
      default: 'upcoming',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

recruitmentDriveSchema.index({ club: 1, status: 1 });

module.exports = mongoose.model('RecruitmentDrive', recruitmentDriveSchema);
