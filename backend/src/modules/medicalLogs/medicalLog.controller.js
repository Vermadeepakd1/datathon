const medicalLogService = require("./medicalLog.service");

const createMedicalLog = async (req, res, next) => {
  try {
    const medicalLog = await medicalLogService.createMedicalLog(req.validated);
    res.status(201).json({ success: true, data: medicalLog });
  } catch (error) {
    next(error);
  }
};

const listMedicalLogs = async (req, res, next) => {
  try {
    const logs = await medicalLogService.listMedicalLogs(req.validatedQuery, {
      adminToken: req.header("x-admin-token"),
    });
    res.json({
      success: true,
      data: {
        count: logs.length,
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUserMedicalHistory = async (req, res, next) => {
  try {
    const history = await medicalLogService.getUserMedicalHistory(
      req.validatedParams.userId,
      req.validatedQuery,
      {
        adminToken: req.header("x-admin-token"),
      }
    );
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMedicalLog, listMedicalLogs, getUserMedicalHistory };
