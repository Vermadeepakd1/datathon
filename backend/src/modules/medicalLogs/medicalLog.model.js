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
    hemoglobinEncrypted: {
      type: String,
      required: true,
      select: false,
    },
    chronicConditionsEncrypted: {
      type: String,
      required: true,
      select: false,
    },
    chronicConditionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    hasDisqualifyingCondition: {
      type: Boolean,
      default: false,
      index: true,
    },
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
medicalLogSchema.index({ hasDisqualifyingCondition: 1, recordedAt: -1 });

module.exports = mongoose.model("MedicalLog", medicalLogSchema);
