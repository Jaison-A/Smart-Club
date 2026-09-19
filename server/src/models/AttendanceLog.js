const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      // Optional: only set for QR-based marks. A manual mark by a
      // coordinator has no session to reference.
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      enum: ['qr', 'manual'],
      default: 'qr',
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One attendance record per student per event, regardless of how many
// sessions were generated for it — prevents duplicate scans/marks.
attendanceLogSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
