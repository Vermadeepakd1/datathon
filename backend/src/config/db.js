const mongoose = require("mongoose");
const env = require("./env");

const connectDb = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, {
    family: 4, // Force IPv4
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  return mongoose.connection;
};

module.exports = { connectDb };
