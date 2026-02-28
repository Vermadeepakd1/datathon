const { Router } = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const { createMedicalLogSchema } = require("./medicalLog.validation");
const medicalLogController = require("./medicalLog.controller");

const router = Router();

router.post("/", validateRequest(createMedicalLogSchema), medicalLogController.createMedicalLog);

module.exports = router;
