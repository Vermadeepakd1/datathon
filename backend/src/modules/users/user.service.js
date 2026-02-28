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
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 500);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;

  const filters = {};
  if (query.search) {
    filters.name = { $regex: query.search, $options: "i" };
  }

  const [users, total] = await Promise.all([
    User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filters),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    items: users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
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
