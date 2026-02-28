const dns = require("dns");
const mongoose = require("mongoose");
const { connectDb } = require("../src/config/db");
const env = require("../src/config/env");
const User = require("../src/modules/users/user.model");
const MedicalLog = require("../src/modules/medicalLogs/medicalLog.model");
const { createAnonDonorId } = require("../src/utils/anonymize");
const { encryptMedicalPayload } = require("../src/utils/medicalEncryption");
const { hasDisqualifyingCondition } = require("../src/modules/medicalLogs/medicalLog.service");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CONDITION_PROFILES = [
  [],
  ["asthma"],
  ["thyroid"],
  ["pcos"],
  ["diabetes"],
  ["anemia history"],
  ["hepatitis b"],
  ["hiv"],
  ["hepatitis c"],
];
const FIRST_NAMES = [
  "Aarohi",
  "Bhavna",
  "Charita",
  "Divya",
  "Esha",
  "Farah",
  "Gauri",
  "Harini",
  "Ishita",
  "Jasmin",
  "Kavya",
  "Lina",
  "Meera",
  "Naina",
  "Oviya",
  "Pallavi",
  "Rhea",
  "Sana",
  "Tanvi",
  "Vidya",
];
const LAST_NAMES = [
  "Patel",
  "Sharma",
  "Nair",
  "Das",
  "Rao",
  "Gupta",
  "Khan",
  "Bose",
  "Singh",
  "Menon",
];

const DONOR_COUNT = Math.max(Number(process.env.LARGE_SEED_COUNT || 10000), 1000);

const clampHb = (value) => Number(Math.max(10.0, Math.min(16.8, value)).toFixed(1));

const buildTimeline = (baseHemoglobin, conditionProfile, idx) => {
  const oldestShift = ((idx % 5) - 2) * 0.35;
  const midShift = ((idx % 3) - 1) * 0.25;
  return [
    {
      recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (100 + (idx % 11))),
      hemoglobin: clampHb(baseHemoglobin + oldestShift),
      chronicConditions: [],
    },
    {
      recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (38 + (idx % 7))),
      hemoglobin: clampHb(baseHemoglobin + midShift),
      chronicConditions: idx % 13 === 0 ? ["asthma"] : conditionProfile.filter((item) => item === "asthma"),
    },
    {
      recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (idx % 4)),
      hemoglobin: clampHb(baseHemoglobin),
      chronicConditions: conditionProfile,
    },
  ].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
};

const buildDonorBlueprints = (count) => {
  const blueprints = [];
  for (let i = 0; i < count; i += 1) {
    const donorIndex = i + 1;
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const bloodGroup = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
    const donorConsent = i % 8 !== 0;
    const conditionProfile = CONDITION_PROFILES[i % CONDITION_PROFILES.length];
    const baseHemoglobin = 11.1 + ((i * 23) % 51) / 10;
    const timeline = buildTimeline(baseHemoglobin, conditionProfile, i);
    const latest = timeline[timeline.length - 1];
    const disqualified = hasDisqualifyingCondition(latest.chronicConditions);
    const ready = donorConsent && latest.hemoglobin >= 12.5 && !disqualified;

    const longitude = Number((-74.25 + (i % 120) * 0.0035).toFixed(6));
    const latitude = Number((40.5 + Math.floor(i / 120) * 0.0018 + (i % 3) * 0.0007).toFixed(6));

    blueprints.push({
      user: {
        name: `${first} ${last} ${String(donorIndex).padStart(5, "0")}`,
        bloodGroup,
        age: 18 + ((i * 7) % 47),
        donorConsent,
        donorAvailability: ready ? "Ready-to-Donate" : "Unavailable",
        contact: {
          phone: `556${String(1000000 + donorIndex).slice(-7)}`,
          email: `large_donor_${String(donorIndex).padStart(5, "0")}@example.com`,
        },
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
      timeline,
    });
  }
  return blueprints;
};

const run = async () => {
  await connectDb();
  await User.deleteMany({});
  await MedicalLog.deleteMany({});

  const blueprints = buildDonorBlueprints(DONOR_COUNT);
  const users = await User.insertMany(
    blueprints.map((item) => item.user),
    { ordered: true }
  );

  const logs = [];
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const timeline = blueprints[i].timeline;
    const anonDonorId = createAnonDonorId(user._id, env.anonymizationSalt);

    timeline.forEach((entry) => {
      const disqualified = hasDisqualifyingCondition(entry.chronicConditions);
      logs.push({
        userRef: user._id,
        anonDonorId,
        hemoglobin: entry.hemoglobin,
        hemoglobinEncrypted: encryptMedicalPayload(
          entry.hemoglobin,
          env.medicalEncryptionKey
        ),
        chronicConditionsEncrypted: encryptMedicalPayload(
          entry.chronicConditions,
          env.medicalEncryptionKey
        ),
        chronicConditionCount: entry.chronicConditions.length,
        hasDisqualifyingCondition: disqualified,
        recordedAt: entry.recordedAt,
      });
    });
  }

  await MedicalLog.insertMany(logs, { ordered: false });

  const readyCount = await User.countDocuments({ donorAvailability: "Ready-to-Donate" });
  const unavailableCount = await User.countDocuments({ donorAvailability: "Unavailable" });

  // eslint-disable-next-line no-console
  console.log(
    `Large seed complete: users=${users.length}, logs=${logs.length}, ready=${readyCount}, unavailable=${unavailableCount}`
  );
  await mongoose.connection.close();
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
