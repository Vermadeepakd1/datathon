const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const RECEIVER_TO_DONOR_MAP = {
  "O-": ["O-"],
  "O+": ["O+", "O-"],
  "A-": ["A-", "O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
};

const normalizeBloodGroup = (bloodGroup = "") => bloodGroup.trim().toUpperCase();

const getCompatibleDonorGroups = (patientBloodGroup) => {
  const normalized = normalizeBloodGroup(patientBloodGroup);
  return RECEIVER_TO_DONOR_MAP[normalized] || [];
};

module.exports = {
  BLOOD_GROUPS,
  normalizeBloodGroup,
  getCompatibleDonorGroups,
};
