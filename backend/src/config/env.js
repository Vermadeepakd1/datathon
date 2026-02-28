const dotenv = require("dotenv");

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 5000),
  mongoUri:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/maternal_guard",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000",
  anonymizationSalt: process.env.ANONYMIZATION_SALT || "dev_salt_change_me",
  adminAccessToken: process.env.ADMIN_ACCESS_TOKEN || "dev_admin_token",
  medicalEncryptionKey:
    process.env.MEDICAL_ENCRYPTION_KEY || "dev_medical_key_change_me",
};

module.exports = env;
