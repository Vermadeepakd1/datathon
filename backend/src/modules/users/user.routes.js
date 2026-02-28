const { Router } = require("express");
const {
  validateRequest,
  validateQuery,
  validateParams,
} = require("../../middleware/validateRequest");
const {
  createUserSchema,
  listUsersQuerySchema,
  userIdParamsSchema,
  updateDonorStatusSchema,
} = require("./user.validation");
const userController = require("./user.controller");

const router = Router();

router.post("/", validateRequest(createUserSchema), userController.createUser);
router.get("/", validateQuery(listUsersQuerySchema), userController.listUsers);
router.patch(
  "/:userId/donor-status",
  validateParams(userIdParamsSchema),
  validateRequest(updateDonorStatusSchema),
  userController.updateDonorStatus
);

module.exports = router;
