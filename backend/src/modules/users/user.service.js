const User = require("./user.model");

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

module.exports = { createUser, listUsers };
