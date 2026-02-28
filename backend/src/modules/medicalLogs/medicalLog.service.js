const MedicalLog = require("./medicalLog.model");
const User = require("../users/user.model");
const env = require("../../config/env");
const { createAnonDonorId } = require("../../utils/anonymize");
const { HttpError } = require("../../utils/httpError");

const DISQUALIFYING_CONDITIONS = new Set(["hiv", "hepatitis b", "hepatitis c"]);

const hasDisqualifyingCondition = (conditions = []) => {
  return conditions.some((item) =>
    DISQUALIFYING_CONDITIONS.has(String(item).trim().toLowerCase())
  );
};

const createMedicalLog = async (payload) => {
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const anonDonorId = createAnonDonorId(user._id, env.anonymizationSalt);
  const chronicConditions = payload.chronicConditions || [];
  const disqualified = hasDisqualifyingCondition(chronicConditions);
  const isHemoglobinEligible = payload.hemoglobin >= 12.5;

  const log = await MedicalLog.create({
    userRef: user._id,
    anonDonorId,
    hemoglobin: payload.hemoglobin,
    chronicConditions,
    recordedAt: payload.recordedAt || new Date(),
  });

  user.donorAvailability =
    user.donorConsent && isHemoglobinEligible && !disqualified
      ? "Ready-to-Donate"
      : "Unavailable";
  await user.save();

  return log;
};

module.exports = { createMedicalLog, hasDisqualifyingCondition };
