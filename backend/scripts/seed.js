const dns = require("dns");
const mongoose = require("mongoose");
const env = require("../src/config/env");
const { connectDb } = require("../src/config/db");
const User = require("../src/modules/users/user.model");
const MedicalLog = require("../src/modules/medicalLogs/medicalLog.model");
const { createAnonDonorId } = require("../src/utils/anonymize");

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

const run = async () => {
  await connectDb();
  await User.deleteMany({});
  await MedicalLog.deleteMany({});

  for (const donor of donors) {
    const user = await User.create({
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      age: donor.age,
      donorConsent: donor.donorConsent,
      donorAvailability: donor.donorAvailability,
      contact: donor.contact,
      location: donor.location,
    });

    await MedicalLog.create({
      userRef: user._id,
      anonDonorId: createAnonDonorId(user._id, env.anonymizationSalt),
      hemoglobin: donor.hemoglobin,
      chronicConditions: donor.chronicConditions,
      recordedAt: new Date(),
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seeded users and medical logs.");
  await mongoose.connection.close();
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
