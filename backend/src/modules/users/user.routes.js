const { Router } = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const { createUserSchema } = require("./user.validation");
const userController = require("./user.controller");

const router = Router();

router.post("/", validateRequest(createUserSchema), userController.createUser);
router.get("/", userController.listUsers);

module.exports = router;
