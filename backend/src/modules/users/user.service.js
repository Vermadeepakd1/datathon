const User = require("./user.model");
const mongoose = require("mongoose");
const { HttpError } = require("../../utils/httpError");

const createUser = async (payload) => {
  const normalizedPayload = {
    ...payload,
    donorAvailability:
      payload.donorConsent === true
        ? payload.donorAvailability || "Ready-to-Donate"
        : "Unavailable",
  };

  const user = await User.create(normalizedPayload);
  return user;
};

const listUsers = async (query) => {
  const limit = Math.min(Number(query.limit) || 50, 200);
  const users = await User.find().sort({ createdAt: -1 }).limit(limit);
  return users;
};

const updateDonorStatus = async (userId, payload) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new HttpError(400, "Invalid userId");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  user.donorConsent = payload.donorConsent;
  if (payload.donorConsent === false) {
    user.donorAvailability = "Unavailable";
  } else {
    user.donorAvailability = payload.donorAvailability || "Ready-to-Donate";
  }

  await user.save();
  return user;
};

module.exports = { createUser, listUsers, updateDonorStatus };
