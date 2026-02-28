const { Router } = require("express");
const {
  validateRequest,
  validateParams,
} = require("../../middleware/validateRequest");
const alertsController = require("./alerts.controller");
const {
  createHemorrhageAlertSchema,
  revealAlertDonorsSchema,
  alertIdParamsSchema,
} = require("./alerts.validation");

const router = Router();

router.post(
  "/hemorrhage",
  validateRequest(createHemorrhageAlertSchema),
  alertsController.triggerHemorrhageAlert
);
router.get("/:alertId", validateParams(alertIdParamsSchema), alertsController.getAlertById);
router.post(
  "/:alertId/reveal-donors",
  validateParams(alertIdParamsSchema),
  validateRequest(revealAlertDonorsSchema),
  alertsController.revealDonorContacts
);

module.exports = router;
