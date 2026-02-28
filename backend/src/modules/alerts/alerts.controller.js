const alertsService = require("./alerts.service");

const triggerHemorrhageAlert = async (req, res, next) => {
  try {
    const alert = await alertsService.createHemorrhageAlert(req.validated);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

const getAlertById = async (req, res, next) => {
  try {
    const alert = await alertsService.getAlertById(req.params.alertId);
    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

const revealDonorContacts = async (req, res, next) => {
  try {
    const donors = await alertsService.revealDonorContacts({
      alertId: req.params.alertId,
      donorAnonIds: req.validated.donorAnonIds || [],
      adminToken: req.header("x-admin-token"),
    });

    res.json({
      success: true,
      data: {
        alertId: req.params.alertId,
        revealedCount: donors.length,
        donors,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { triggerHemorrhageAlert, getAlertById, revealDonorContacts };
