const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId");

const createMedicalLogSchema = z.object({
  userId: objectIdSchema,
  hemoglobin: z.number().min(0).max(25),
  chronicConditions: z.array(z.string().trim().min(1).max(120)).optional(),
  recordedAt: z.coerce.date().optional(),
});

const listMedicalLogsQuerySchema = z.object({
  userId: objectIdSchema.optional(),
  anonDonorId: z.string().trim().min(3).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
  includeSensitive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
});

const userHistoryParamsSchema = z.object({
  userId: objectIdSchema,
});

const userHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  includeSensitive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
});

module.exports = {
  createMedicalLogSchema,
  listMedicalLogsQuerySchema,
  userHistoryParamsSchema,
  userHistoryQuerySchema,
};
