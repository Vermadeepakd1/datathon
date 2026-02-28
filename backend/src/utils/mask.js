const maskName = (name = "") => {
  if (!name) return "Donor";
  const trimmed = name.trim();
  if (trimmed.length <= 2) return `${trimmed[0] || "D"}*`;
  return `${trimmed[0]}${"*".repeat(Math.max(trimmed.length - 2, 2))}${trimmed.slice(
    -1
  )}`;
};

const maskPhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `******${digits.slice(-4)}`;
};

const maskEmail = (email = "") => {
  const [user, domain] = String(email).split("@");
  if (!user || !domain) return "hidden@example.com";
  const safeUser = user.length <= 2 ? `${user[0] || "u"}*` : `${user[0]}***${user.slice(-1)}`;
  return `${safeUser}@${domain}`;
};

module.exports = { maskName, maskPhone, maskEmail };
