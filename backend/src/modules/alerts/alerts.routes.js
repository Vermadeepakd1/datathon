const { Router } = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const alertsController = require("./alerts.controller");
const {
  createHemorrhageAlertSchema,
  revealAlertDonorsSchema,
} = require("./alerts.validation");

const router = Router();

router.post(
  "/hemorrhage",
  validateRequest(createHemorrhageAlertSchema),
  alertsController.triggerHemorrhageAlert
);
router.get("/:alertId", alertsController.getAlertById);
router.post(
  "/:alertId/reveal-donors",
  validateRequest(revealAlertDonorsSchema),
  alertsController.revealDonorContacts
);

module.exports = router;
