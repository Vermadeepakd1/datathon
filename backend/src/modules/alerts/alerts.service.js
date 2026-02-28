const Alert = require("./alert.model");
const User = require("../users/user.model");
const env = require("../../config/env");
const { HttpError } = require("../../utils/httpError");
const { searchCompatibleDonors } = require("../matchmaking/matchmaking.service");

const toPublicAlertResponse = (alertDoc) => ({
  alertId: alertDoc._id,
  alertType: alertDoc.alertType,
  status: alertDoc.status,
  patientBloodGroup: alertDoc.patientBloodGroup,
  radiusKm: alertDoc.radiusKm,
  candidateCount: alertDoc.candidates.length,
  candidates: alertDoc.candidates.map((item) => ({
    anonDonorId: item.anonDonorId,
    maskedAlias: item.maskedAlias,
    bloodGroup: item.bloodGroup,
    distanceKm: Number((item.distanceMeters / 1000).toFixed(2)),
    healthScore: item.healthScore,
    isContactRevealed: item.isContactRevealed,
  })),
  createdAt: alertDoc.createdAt,
});

const createHemorrhageAlert = async (payload) => {
  const candidates = await searchCompatibleDonors(
    {
      patientBloodGroup: payload.patientBloodGroup,
      location: payload.location,
      radiusKm: payload.radiusKm,
      limit: payload.limit,
      minHemoglobin: payload.minHemoglobin,
    },
    { includePrivate: true }
  );

  const alert = await Alert.create({
    alertType: "hemorrhage",
    status: "Open",
    patientBloodGroup: payload.patientBloodGroup,
    origin: payload.location,
    radiusKm: payload.radiusKm,
    metadata: {
      facilityCode: payload.facilityCode || "",
      patientRiskLevel: payload.patientRiskLevel || "unknown",
      notes: payload.notes || "",
    },
    candidates: candidates.map((item) => ({
      donorRef: item.donorRef,
      anonDonorId: item.anonDonorId,
      maskedAlias: item.maskedAlias,
      bloodGroup: item.bloodGroup,
      distanceMeters: item.distanceMeters,
      healthScore: item.healthScore,
      isContactRevealed: false,
    })),
  });

  return toPublicAlertResponse(alert);
};

const getAlertById = async (alertId) => {
  const alert = await Alert.findById(alertId);
  if (!alert) {
    throw new HttpError(404, "Alert not found");
  }
  return toPublicAlertResponse(alert);
};

const revealDonorContacts = async ({ alertId, donorAnonIds, adminToken }) => {
  if (!adminToken || adminToken !== env.adminAccessToken) {
    throw new HttpError(401, "Invalid admin token for contact reveal");
  }

  const alert = await Alert.findById(alertId);
  if (!alert) {
    throw new HttpError(404, "Alert not found");
  }

  const filteredCandidates = donorAnonIds?.length
    ? alert.candidates.filter((candidate) =>
        donorAnonIds.includes(candidate.anonDonorId)
      )
    : alert.candidates;

  if (filteredCandidates.length === 0) {
    return [];
  }

  const donorIds = filteredCandidates.map((candidate) => candidate.donorRef);
  const donors = await User.find({ _id: { $in: donorIds } });
  const donorMap = new Map(donors.map((donor) => [String(donor._id), donor]));

  const revealed = [];
  filteredCandidates.forEach((candidate) => {
    const donor = donorMap.get(String(candidate.donorRef));
    if (!donor || donor.donorConsent !== true) {
      return;
    }

    candidate.isContactRevealed = true;
    revealed.push({
      donorId: donor._id,
      anonDonorId: candidate.anonDonorId,
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      phone: donor.contact?.phone || "",
      email: donor.contact?.email || "",
      distanceKm: Number((candidate.distanceMeters / 1000).toFixed(2)),
      healthScore: candidate.healthScore,
    });
  });

  alert.lastRevealAt = new Date();
  await alert.save();

  return revealed;
};

module.exports = {
  createHemorrhageAlert,
  getAlertById,
  revealDonorContacts,
};
