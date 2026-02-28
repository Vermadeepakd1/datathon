const MedicalLog = require("./medicalLog.model");
const User = require("../users/user.model");
const env = require("../../config/env");
const { createAnonDonorId } = require("../../utils/anonymize");
const {
  encryptMedicalPayload,
  decryptMedicalPayload,
} = require("../../utils/medicalEncryption");
const { HttpError } = require("../../utils/httpError");

const DISQUALIFYING_CONDITIONS = new Set(["hiv", "hepatitis b", "hepatitis c"]);

const hasDisqualifyingCondition = (conditions = []) => {
  return conditions.some((item) =>
    DISQUALIFYING_CONDITIONS.has(String(item).trim().toLowerCase())
  );
};

const isAdminAuthorized = (adminToken) =>
  Boolean(adminToken) && adminToken === env.adminAccessToken;

const mapLogForResponse = (log, includeSensitive = false) => {
  const result = {
    id: log._id,
    userId: log.userRef ? String(log.userRef) : undefined,
    anonDonorId: log.anonDonorId,
    hemoglobin: log.hemoglobin,
    chronicConditionCount: log.chronicConditionCount,
    hasDisqualifyingCondition: log.hasDisqualifyingCondition,
    donorEligible: log.hemoglobin >= 12.5 && !log.hasDisqualifyingCondition,
    recordedAt: log.recordedAt,
    createdAt: log.createdAt,
  };

  if (includeSensitive) {
    try {
      result.hemoglobinDecrypted = decryptMedicalPayload(
        log.hemoglobinEncrypted,
        env.medicalEncryptionKey
      );
    } catch (_error) {
      result.hemoglobinDecrypted = null;
    }

    try {
      result.chronicConditions = decryptMedicalPayload(
        log.chronicConditionsEncrypted,
        env.medicalEncryptionKey
      );
    } catch (_error) {
      result.chronicConditions = [];
    }
  }

  return result;
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

  const encryptedHemoglobin = encryptMedicalPayload(
    payload.hemoglobin,
    env.medicalEncryptionKey
  );
  const encryptedConditions = encryptMedicalPayload(
    chronicConditions,
    env.medicalEncryptionKey
  );

  const log = await MedicalLog.create({
    userRef: user._id,
    anonDonorId,
    hemoglobin: payload.hemoglobin,
    hemoglobinEncrypted: encryptedHemoglobin,
    chronicConditionsEncrypted: encryptedConditions,
    chronicConditionCount: chronicConditions.length,
    hasDisqualifyingCondition: disqualified,
    recordedAt: payload.recordedAt || new Date(),
  });

  user.donorAvailability =
    user.donorConsent && isHemoglobinEligible && !disqualified
      ? "Ready-to-Donate"
      : "Unavailable";
  await user.save();

  return {
    id: log._id,
    userId: String(user._id),
    anonDonorId,
    hemoglobin: log.hemoglobin,
    chronicConditionCount: log.chronicConditionCount,
    hasDisqualifyingCondition: log.hasDisqualifyingCondition,
    donorEligible: log.hemoglobin >= 12.5 && !log.hasDisqualifyingCondition,
    recordedAt: log.recordedAt,
  };
};

const listMedicalLogs = async (query, options = {}) => {
  const filters = {};
  if (query.userId) filters.userRef = query.userId;
  if (query.anonDonorId) filters.anonDonorId = query.anonDonorId;

  const includeSensitive =
    query.includeSensitive === true && isAdminAuthorized(options.adminToken);
  const limit = Math.min(Number(query.limit) || 50, 500);

  let dbQuery = MedicalLog.find(filters).sort({ recordedAt: -1 }).limit(limit);
  if (includeSensitive) {
    dbQuery = dbQuery.select("+hemoglobinEncrypted +chronicConditionsEncrypted");
  }

  const logs = await dbQuery.lean();
  return logs.map((log) => mapLogForResponse(log, includeSensitive));
};

const getUserMedicalHistory = async (userId, query, options = {}) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const logs = await listMedicalLogs(
    {
      userId,
      limit: query.limit,
      includeSensitive: query.includeSensitive,
    },
    options
  );

  const totalLogs = logs.length;
  const eligibleLogs = logs.filter((log) => log.donorEligible).length;
  const averageHemoglobin =
    totalLogs > 0
      ? Number(
          (
            logs.reduce((sum, log) => sum + Number(log.hemoglobin || 0), 0) /
            totalLogs
          ).toFixed(2)
        )
      : 0;

  return {
    donor: {
      userId: String(user._id),
      name: user.name,
      bloodGroup: user.bloodGroup,
      donorConsent: user.donorConsent,
      donorAvailability: user.donorAvailability,
    },
    summary: {
      totalLogs,
      eligibleLogs,
      averageHemoglobin,
      latestRecordedAt: logs[0]?.recordedAt || null,
    },
    logs,
  };
};

module.exports = {
  createMedicalLog,
  hasDisqualifyingCondition,
  listMedicalLogs,
  getUserMedicalHistory,
};
