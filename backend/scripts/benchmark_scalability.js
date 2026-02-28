const fs = require("fs");
const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const { connectDb } = require("../src/config/db");
const User = require("../src/modules/users/user.model");
const MedicalLog = require("../src/modules/medicalLogs/medicalLog.model");
const { searchCompatibleDonors } = require("../src/modules/matchmaking/matchmaking.service");

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ITERATIONS = Math.max(Number(process.env.BENCH_ITERATIONS || 120), 20);
const WARMUP_QUERIES = Math.min(Math.max(Number(process.env.BENCH_WARMUP || 10), 5), 50);

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const percentile = (sortedValues, p) => {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedValues.length) - 1)
  );
  return sortedValues[index];
};

const round = (value, digits = 2) => Number(value.toFixed(digits));

const buildScenario = (index) => {
  const lonJitter = ((index % 25) - 12) * 0.006;
  const latJitter = ((Math.floor(index / 5) % 17) - 8) * 0.004;
  const radiusKm = 10 + (index % 6) * 5; // 10,15,20,25,30,35

  return {
    patientBloodGroup: BLOOD_GROUPS[index % BLOOD_GROUPS.length],
    location: {
      type: "Point",
      coordinates: [round(-74.0 + lonJitter, 6), round(40.73 + latJitter, 6)],
    },
    radiusKm,
    limit: 10,
    minHemoglobin: 12.5,
  };
};

const runWarmup = async () => {
  for (let i = 0; i < WARMUP_QUERIES; i += 1) {
    await searchCompatibleDonors(buildScenario(i));
  }
};

const runBenchmark = async () => {
  const timings = [];
  const candidateCounts = [];

  for (let i = 0; i < ITERATIONS; i += 1) {
    const scenario = buildScenario(i + WARMUP_QUERIES);
    const startedAt = process.hrtime.bigint();
    const donors = await searchCompatibleDonors(scenario);
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    timings.push(elapsedMs);
    candidateCounts.push(donors.length);
  }

  return { timings, candidateCounts };
};

const buildSummary = (timings, candidateCounts) => {
  const sorted = [...timings].sort((a, b) => a - b);
  const mean = timings.reduce((sum, value) => sum + value, 0) / Math.max(timings.length, 1);
  const candidateMean =
    candidateCounts.reduce((sum, value) => sum + value, 0) / Math.max(candidateCounts.length, 1);

  return {
    iterations: timings.length,
    latencyMs: {
      min: round(sorted[0] || 0),
      avg: round(mean),
      p50: round(percentile(sorted, 50)),
      p90: round(percentile(sorted, 90)),
      p95: round(percentile(sorted, 95)),
      p99: round(percentile(sorted, 99)),
      max: round(sorted[sorted.length - 1] || 0),
    },
    candidateCount: {
      min: Math.min(...candidateCounts),
      avg: round(candidateMean, 2),
      max: Math.max(...candidateCounts),
    },
  };
};

const persistReport = (report) => {
  const reportDir = path.resolve(__dirname, "..", "reports");
  const reportPath = path.join(reportDir, "scalability_report.json");
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  return reportPath;
};

const run = async () => {
  await connectDb();

  const [users, logs, readyDonors] = await Promise.all([
    User.countDocuments({}),
    MedicalLog.countDocuments({}),
    User.countDocuments({ donorAvailability: "Ready-to-Donate", donorConsent: true }),
  ]);

  if (users < 10000) {
    // eslint-disable-next-line no-console
    console.warn(
      `Warning: user count is ${users}. Run "npm run seed:large" for 10,000+ donor benchmark.`
    );
  }

  await runWarmup();
  const { timings, candidateCounts } = await runBenchmark();
  const summary = buildSummary(timings, candidateCounts);

  const report = {
    generatedAt: new Date().toISOString(),
    dataset: {
      users,
      medicalLogs: logs,
      readyDonors,
    },
    benchmark: summary,
    config: {
      iterations: ITERATIONS,
      warmupQueries: WARMUP_QUERIES,
      queryTemplate: {
        radiusKmRange: [10, 35],
        limit: 10,
        minHemoglobin: 12.5,
      },
    },
  };

  const reportPath = persistReport(report);

  // eslint-disable-next-line no-console
  console.log("Scalability benchmark completed.");
  // eslint-disable-next-line no-console
  console.log(`Dataset: users=${users}, logs=${logs}, readyDonors=${readyDonors}`);
  // eslint-disable-next-line no-console
  console.log(`Latency (ms): ${JSON.stringify(summary.latencyMs)}`);
  // eslint-disable-next-line no-console
  console.log(`Candidate count: ${JSON.stringify(summary.candidateCount)}`);
  // eslint-disable-next-line no-console
  console.log(`Report saved: ${reportPath}`);

  await mongoose.connection.close();
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
