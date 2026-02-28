const User = require("../users/user.model");
const { hasDisqualifyingCondition } = require("../medicalLogs/medicalLog.service");
const { createAnonDonorId } = require("../../utils/anonymize");
const env = require("../../config/env");
const {
  getCompatibleDonorGroups,
  normalizeBloodGroup,
} = require("../../utils/bloodCompatibility");
const { maskName, maskPhone, maskEmail } = require("../../utils/mask");
const { HttpError } = require("../../utils/httpError");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const computeHealthScore = (hemoglobin, distanceKm, chronicConditions = []) => {
  const hbBoost = clamp((hemoglobin - 12.5) * 8, 0, 30);
  const distanceBoost = clamp(20 - distanceKm, 0, 20);
  const conditionPenalty = clamp(chronicConditions.length * 2, 0, 10);
  return clamp(Math.round(50 + hbBoost + distanceBoost - conditionPenalty), 0, 100);
};

const buildBasePipeline = (payload, compatibleGroups) => [
  {
    $geoNear: {
      near: payload.location,
      distanceField: "distanceMeters",
      maxDistance: payload.radiusKm * 1000,
      spherical: true,
      query: {
        donorConsent: true,
        donorAvailability: "Ready-to-Donate",
        bloodGroup: { $in: compatibleGroups },
      },
    },
  },
  {
    $lookup: {
      from: "medicallogs",
      let: { donorId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$userRef", "$$donorId"] } } },
        { $sort: { recordedAt: -1 } },
        { $limit: 1 },
        {
          $project: {
            _id: 0,
            anonDonorId: 1,
            hemoglobin: 1,
            chronicConditions: 1,
            recordedAt: 1,
          },
        },
      ],
      as: "latestMedicalLog",
    },
  },
  { $unwind: { path: "$latestMedicalLog", preserveNullAndEmptyArrays: false } },
  {
    $match: {
      "latestMedicalLog.hemoglobin": { $gte: payload.minHemoglobin },
    },
  },
  {
    $project: {
      name: 1,
      bloodGroup: 1,
      contact: 1,
      distanceMeters: 1,
      latestMedicalLog: 1,
    },
  },
  { $limit: payload.limit * 3 },
];

const toDonorCandidate = (doc) => {
  const chronicConditions = doc.latestMedicalLog.chronicConditions || [];
  if (hasDisqualifyingCondition(chronicConditions)) {
    return null;
  }

  const distanceKm = Number((doc.distanceMeters / 1000).toFixed(2));
  const anonDonorId =
    doc.latestMedicalLog.anonDonorId || createAnonDonorId(doc._id, env.anonymizationSalt);
  const healthScore = computeHealthScore(
    doc.latestMedicalLog.hemoglobin,
    distanceKm,
    chronicConditions
  );

  return {
    donorRef: doc._id,
    anonDonorId,
    maskedAlias: maskName(doc.name),
    bloodGroup: doc.bloodGroup,
    distanceMeters: doc.distanceMeters,
    distanceKm,
    hemoglobin: doc.latestMedicalLog.hemoglobin,
    healthScore,
    contactMasked: {
      phone: maskPhone(doc.contact?.phone || ""),
      email: maskEmail(doc.contact?.email || ""),
    },
    private: {
      name: doc.name,
      phone: doc.contact?.phone || "",
      email: doc.contact?.email || "",
    },
  };
};

const searchCompatibleDonors = async (payload, options = {}) => {
  const normalizedPatientGroup = normalizeBloodGroup(payload.patientBloodGroup);
  const compatibleGroups = getCompatibleDonorGroups(normalizedPatientGroup);

  if (compatibleGroups.length === 0) {
    throw new HttpError(400, "Invalid patient blood group");
  }

  const docs = await User.aggregate(buildBasePipeline(payload, compatibleGroups));
  const candidates = docs
    .map(toDonorCandidate)
    .filter(Boolean)
    .sort((a, b) => b.healthScore - a.healthScore || a.distanceMeters - b.distanceMeters)
    .slice(0, payload.limit);

  if (options.includePrivate) {
    return candidates;
  }

  return candidates.map((candidate) => ({
    anonDonorId: candidate.anonDonorId,
    maskedAlias: candidate.maskedAlias,
    bloodGroup: candidate.bloodGroup,
    distanceKm: candidate.distanceKm,
    healthScore: candidate.healthScore,
    contactMasked: candidate.contactMasked,
  }));
};

module.exports = { searchCompatibleDonors };
