const { Router } = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const { searchDonorsSchema } = require("./matchmaking.validation");
const matchmakingController = require("./matchmaking.controller");

const router = Router();

router.post("/search", validateRequest(searchDonorsSchema), matchmakingController.searchDonors);

module.exports = router;
