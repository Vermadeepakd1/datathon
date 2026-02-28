const diagnosticsService = require("./diagnostics.service");

const evaluateDiagnostics = async (req, res, next) => {
  try {
    const result = await diagnosticsService.evaluateDiagnosticInput(req.validated);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { evaluateDiagnostics };
