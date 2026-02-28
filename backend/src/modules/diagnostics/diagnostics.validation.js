const { z } = require("zod");
const { BLOOD_GROUPS } = require("../../utils/bloodCompatibility");

const diagnosticInputSchema = z.object({
  age: z.number().int().min(10).max(55),
  systolicBP: z.number().min(70).max(250),
  diastolicBP: z.number().min(40).max(160),
  bloodGlucose: z.number().min(40).max(450),
  bodyTemp: z.number().min(90).max(110),
  heartRate: z.number().min(30).max(220),
  patientBloodGroup: z.enum(BLOOD_GROUPS),
  facilityCode: z.string().trim().max(60).optional(),
});

module.exports = { diagnosticInputSchema };
