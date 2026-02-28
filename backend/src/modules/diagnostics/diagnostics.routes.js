const { Router } = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const diagnosticsController = require("./diagnostics.controller");
const { diagnosticInputSchema } = require("./diagnostics.validation");

const router = Router();

router.post("/evaluate", validateRequest(diagnosticInputSchema), diagnosticsController.evaluateDiagnostics);

module.exports = router;
