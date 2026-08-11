const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Applied', 'Reviewed', 'Accepted', 'Rejected'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Reviewed', 'Accepted', 'Rejected'],
      default: 'Applied',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [{ status: 'Applied', changedAt: new Date() }],
    },
  },
  { timestamps: true }
);

applicationSchema.index({ user: 1, program: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
