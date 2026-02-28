const dns = require("dns");
const app = require("./app");
const env = require("./config/env");
const { connectDb } = require("./config/db");

// Set Google's DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const start = async () => {
  try {
    await connectDb();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
