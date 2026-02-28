const { z } = require("zod");

const createMedicalLogSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"),
  hemoglobin: z.number().min(0).max(25),
  chronicConditions: z.array(z.string().trim().min(1).max(120)).optional(),
  recordedAt: z.coerce.date().optional(),
});

module.exports = { createMedicalLogSchema };
