const mongoose = require("mongoose");
const { BLOOD_GROUPS } = require("../../utils/bloodCompatibility");

const { Schema } = mongoose;

const alertCandidateSchema = new Schema(
  {
    donorRef: { type: Schema.Types.ObjectId, ref: "User", required: true },
    anonDonorId: { type: String, required: true },
    maskedAlias: { type: String, required: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    distanceMeters: { type: Number, required: true },
    healthScore: { type: Number, required: true },
    isContactRevealed: { type: Boolean, default: false },
  },
  { _id: false }
);

const alertSchema = new Schema(
  {
    alertType: {
      type: String,
      enum: ["hemorrhage"],
      default: "hemorrhage",
    },
    status: {
      type: String,
      enum: ["Open", "Resolved"],
      default: "Open",
      index: true,
    },
    patientBloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: true,
      index: true,
    },
    origin: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    radiusKm: { type: Number, required: true },
    metadata: {
      facilityCode: { type: String, default: "" },
      patientRiskLevel: {
        type: String,
        enum: ["low", "medium", "high", "unknown"],
        default: "unknown",
      },
      notes: { type: String, default: "" },
    },
    candidates: [alertCandidateSchema],
    lastRevealAt: Date,
  },
  { timestamps: true }
);

alertSchema.index({ origin: "2dsphere" });

module.exports = mongoose.model("Alert", alertSchema);
