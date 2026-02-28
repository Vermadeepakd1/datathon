const matchmakingService = require("./matchmaking.service");

const searchDonors = async (req, res, next) => {
  try {
    const candidates = await matchmakingService.searchCompatibleDonors(req.validated);
    res.json({
      success: true,
      data: {
        patientBloodGroup: req.validated.patientBloodGroup,
        radiusKm: req.validated.radiusKm,
        candidateCount: candidates.length,
        candidates,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchDonors };
