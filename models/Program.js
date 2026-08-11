const mongoose = require('mongoose');

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    university: { type: String, required: true, trim: true },
    country: { type: String, required: true, index: true },
    fieldOfStudy: { type: String, required: true, index: true },
    intake: { type: String, required: true, index: true },
    tuitionFee: { type: Number, required: true },
    minimumIelts: { type: Number, required: true },
    durationMonths: { type: Number },
    description: { type: String },
  },
  { timestamps: true }
);

programSchema.index({ country: 1, fieldOfStudy: 1, intake: 1 });

module.exports = mongoose.model('Program', programSchema);
