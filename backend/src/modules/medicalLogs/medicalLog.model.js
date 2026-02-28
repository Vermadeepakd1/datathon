const mongoose = require("mongoose");

const { Schema } = mongoose;

const medicalLogSchema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      select: false,
    },
    anonDonorId: {
      type: String,
      required: true,
      index: true,
    },
    hemoglobin: {
      type: Number,
      required: true,
      min: 0,
      max: 25,
    },
    chronicConditions: [
      {
        type: String,
        trim: true,
      },
    ],
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

medicalLogSchema.index({ anonDonorId: 1, recordedAt: -1 });
medicalLogSchema.index({ userRef: 1, recordedAt: -1 });

module.exports = mongoose.model("MedicalLog", medicalLogSchema);
