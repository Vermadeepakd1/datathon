const { z } = require("zod");
const { BLOOD_GROUPS } = require("../../utils/bloodCompatibility");

const geoPointSchema = z.object({
  type: z.literal("Point").default("Point"),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .describe("GeoJSON [longitude, latitude]"),
});

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  bloodGroup: z.enum(BLOOD_GROUPS),
  age: z.number().int().min(18).max(65),
  location: geoPointSchema,
  donorConsent: z.boolean().optional().default(false),
  donorAvailability: z.enum(["Unavailable", "Ready-to-Donate"]).optional(),
  contact: z
    .object({
      phone: z.string().trim().max(20).optional(),
      email: z.string().trim().email().optional(),
    })
    .optional(),
});

const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().trim().max(80).optional(),
});

const userIdParamsSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"),
});

const updateDonorStatusSchema = z.object({
  donorConsent: z.boolean(),
  donorAvailability: z.enum(["Unavailable", "Ready-to-Donate"]).optional(),
});

module.exports = {
  createUserSchema,
  listUsersQuerySchema,
  userIdParamsSchema,
  updateDonorStatusSchema,
};
