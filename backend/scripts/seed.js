const dns = require("dns");
const mongoose = require("mongoose");
const { connectDb } = require("../src/config/db");
const User = require("../src/modules/users/user.model");
const MedicalLog = require("../src/modules/medicalLogs/medicalLog.model");
const { createMedicalLog } = require("../src/modules/medicalLogs/medicalLog.service");

// Set Google's DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const donors = [
  {
    name: "Anita Roy",
    bloodGroup: "O+",
    age: 29,
    donorConsent: true,
    donorAvailability: "Ready-to-Donate",
    contact: { phone: "5551001001", email: "anita@example.com" },
    location: { type: "Point", coordinates: [-73.941, 40.731] },
    hemoglobin: 13.2,
    chronicConditions: [],
  },
  {
    name: "Bina Das",
    bloodGroup: "A+",
    age: 31,
    donorConsent: true,
    donorAvailability: "Ready-to-Donate",
    contact: { phone: "5551001002", email: "bina@example.com" },
    location: { type: "Point", coordinates: [-73.95, 40.74] },
    hemoglobin: 12.8,
    chronicConditions: [],
  },
  {
    name: "Carla Shah",
    bloodGroup: "B+",
    age: 34,
    donorConsent: true,
    donorAvailability: "Ready-to-Donate",
    contact: { phone: "5551001003", email: "carla@example.com" },
    location: { type: "Point", coordinates: [-73.98, 40.725] },
    hemoglobin: 13.5,
    chronicConditions: ["asthma"],
  },
  {
    name: "Dona Gill",
    bloodGroup: "AB+",
    age: 27,
    donorConsent: true,
    donorAvailability: "Ready-to-Donate",
    contact: { phone: "5551001004", email: "dona@example.com" },
    location: { type: "Point", coordinates: [-73.91, 40.715] },
    hemoglobin: 12.7,
    chronicConditions: [],
  },
];

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

const buildGeneratedDonors = (count) => {
  const generated = [];

  for (let i = 0; i < count; i += 1) {
    const donorIndex = i + 1;
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const bloodGroup = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
    const donorConsent = i % 7 !== 0;
    const hemoglobin = Number((11.4 + ((i * 17) % 39) / 10).toFixed(1));
    const chronicConditions = CONDITION_PROFILES[i % CONDITION_PROFILES.length];

    const longitude = Number((-74.02 + (i % 12) * 0.01).toFixed(6));
    const latitude = Number((40.66 + Math.floor(i / 12) * 0.012 + (i % 3) * 0.002).toFixed(6));

    generated.push({
      name: `${first} ${last} ${String(donorIndex).padStart(2, "0")}`,
      bloodGroup,
      age: 19 + ((i * 3) % 42), // 19-60
      donorConsent,
      donorAvailability: donorConsent ? "Ready-to-Donate" : "Unavailable",
      contact: {
        phone: `5552${String(100000 + donorIndex).slice(-6)}`,
        email: `donor${String(donorIndex).padStart(2, "0")}@example.com`,
      },
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      hemoglobin,
      chronicConditions,
    });
  }

  return generated;
};

const allDonors = [...donors, ...buildGeneratedDonors(60)];

const run = async () => {
  await connectDb();
  await User.deleteMany({});
  await MedicalLog.deleteMany({});

  for (const donor of allDonors) {
    const user = await User.create({
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      age: donor.age,
      donorConsent: donor.donorConsent,
      donorAvailability: donor.donorAvailability,
      contact: donor.contact,
      location: donor.location,
    });

    await createMedicalLog({
      userId: String(user._id),
      hemoglobin: donor.hemoglobin,
      chronicConditions: donor.chronicConditions || [],
      recordedAt: new Date(),
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${allDonors.length} users and medical logs.`);
  await mongoose.connection.close();
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
