const crypto = require("crypto");

const createAnonDonorId = (userId, salt) => {
  return crypto
    .createHash("sha256")
    .update(`${String(userId)}:${salt}`)
    .digest("hex")
    .slice(0, 20);
};

module.exports = { createAnonDonorId };
