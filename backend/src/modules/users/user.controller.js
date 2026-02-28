const userService = require("./user.service");

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.validated);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await userService.listUsers(req.validatedQuery || req.query);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const updateDonorStatus = async (req, res, next) => {
  try {
    const user = await userService.updateDonorStatus(
      req.params.userId,
      req.validated
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, listUsers, updateDonorStatus };
