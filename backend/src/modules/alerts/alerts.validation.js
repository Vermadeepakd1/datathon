const { z } = require("zod");
const { BLOOD_GROUPS } = require("../../utils/bloodCompatibility");

const geoPointSchema = z.object({
  type: z.literal("Point").default("Point"),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});

const createHemorrhageAlertSchema = z.object({
  patientBloodGroup: z.enum(BLOOD_GROUPS),
  location: geoPointSchema,
  radiusKm: z.number().min(1).max(150).optional().default(25),
  limit: z.number().int().min(1).max(50).optional().default(10),
  minHemoglobin: z.number().min(10).max(16).optional().default(12.5),
  facilityCode: z.string().trim().max(60).optional(),
  patientRiskLevel: z.enum(["low", "medium", "high", "unknown"]).optional().default("unknown"),
  notes: z.string().trim().max(500).optional(),
});

const revealAlertDonorsSchema = z.object({
  donorAnonIds: z.array(z.string().trim().min(3)).optional(),
});

const alertIdParamsSchema = z.object({
  alertId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid alertId"),
});

module.exports = {
  createHemorrhageAlertSchema,
  revealAlertDonorsSchema,
  alertIdParamsSchema,
};
