const mongoose = require("mongoose");
const { BLOOD_GROUPS } = require("../../utils/bloodCompatibility");

const { Schema } = mongoose;

const diagnosticEventSchema = new Schema(
  {
    inputs: {
      age: Number,
      systolicBP: Number,
      diastolicBP: Number,
      bloodGlucose: Number,
      bodyTemp: Number,
      heartRate: Number,
      patientBloodGroup: {
        type: String,
        enum: BLOOD_GROUPS,
      },
    },
    output: {
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
      },
      riskScore: Number,
      primaryRiskDriver: String,
      explainability: [
        {
          feature: String,
          importance: Number,
        },
      ],
      source: {
        type: String,
        enum: ["ml_model", "heuristic_fallback"],
      },
    },
    metadata: {
      facilityCode: String,
      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiagnosticEvent", diagnosticEventSchema);
