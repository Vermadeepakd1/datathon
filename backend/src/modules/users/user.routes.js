const { Router } = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const { createUserSchema, updateDonorStatusSchema } = require("./user.validation");
const userController = require("./user.controller");

const router = Router();

router.post("/", validateRequest(createUserSchema), userController.createUser);
router.get("/", userController.listUsers);
router.patch(
  "/:userId/donor-status",
  validateRequest(updateDonorStatusSchema),
  userController.updateDonorStatus
);

module.exports = router;
