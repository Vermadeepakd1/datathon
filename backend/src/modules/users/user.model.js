const mongoose = require("mongoose");
const { BLOOD_GROUPS } = require("../../utils/bloodCompatibility");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: BLOOD_GROUPS,
      uppercase: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 65,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value) =>
            Array.isArray(value) &&
            value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90,
          message:
            "location.coordinates must be [longitude, latitude] with valid ranges",
        },
      },
    },
    donorConsent: {
      type: Boolean,
      default: false,
      index: true,
    },
    donorAvailability: {
      type: String,
      enum: ["Unavailable", "Ready-to-Donate"],
      default: "Unavailable",
      index: true,
    },
    contact: {
      phone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
    },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });
userSchema.index({ donorConsent: 1, donorAvailability: 1, bloodGroup: 1 });

module.exports = mongoose.model("User", userSchema);
