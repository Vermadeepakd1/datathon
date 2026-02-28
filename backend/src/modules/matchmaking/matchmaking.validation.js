const { z } = require("zod");
const { BLOOD_GROUPS } = require("../../utils/bloodCompatibility");

const geoPointSchema = z.object({
  type: z.literal("Point").default("Point"),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .describe("GeoJSON [longitude, latitude]"),
});

const searchDonorsSchema = z.object({
  patientBloodGroup: z.enum(BLOOD_GROUPS),
  location: geoPointSchema,
  radiusKm: z.number().min(1).max(150).optional().default(25),
  limit: z.number().int().min(1).max(50).optional().default(10),
  minHemoglobin: z.number().min(10).max(16).optional().default(12.5),
});

module.exports = { searchDonorsSchema };
