const medicalLogService = require("./medicalLog.service");

const createMedicalLog = async (req, res, next) => {
  try {
    const medicalLog = await medicalLogService.createMedicalLog(req.validated);
    res.status(201).json({ success: true, data: medicalLog });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMedicalLog };
