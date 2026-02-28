const { Router } = require("express");
const {
  validateRequest,
  validateQuery,
  validateParams,
} = require("../../middleware/validateRequest");
const {
  createMedicalLogSchema,
  listMedicalLogsQuerySchema,
  userHistoryParamsSchema,
  userHistoryQuerySchema,
} = require("./medicalLog.validation");
const medicalLogController = require("./medicalLog.controller");

const router = Router();

router.get("/", validateQuery(listMedicalLogsQuerySchema), medicalLogController.listMedicalLogs);
router.get(
  "/user/:userId/history",
  validateParams(userHistoryParamsSchema),
  validateQuery(userHistoryQuerySchema),
  medicalLogController.getUserMedicalHistory
);
router.post("/", validateRequest(createMedicalLogSchema), medicalLogController.createMedicalLog);

module.exports = router;
