const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

const deriveKey = (secret) => {
  return crypto.createHash("sha256").update(String(secret)).digest();
};

const encryptMedicalPayload = (value, secret) => {
  const iv = crypto.randomBytes(12);
  const key = deriveKey(secret);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString(
    "base64"
  )}`;
};

const decryptMedicalPayload = (ciphertext, secret) => {
  const [ivB64, tagB64, bodyB64] = String(ciphertext).split(".");
  if (!ivB64 || !tagB64 || !bodyB64) {
    throw new Error("Invalid encrypted medical payload format");
  }

  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(bodyB64, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
};

module.exports = { encryptMedicalPayload, decryptMedicalPayload };
