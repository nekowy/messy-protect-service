const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const configPath = path.join(__dirname, "../database", "config.json");

// Ensure database directory exists
const dbDir = path.dirname(configPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Generate or load config
let config;
if (!fs.existsSync(configPath)) {
  console.log("config.json not found. Generating...");
  const generateKey = (len) =>
    crypto
      .randomBytes(Math.ceil(len / 2))
      .toString("hex")
      .slice(0, len);

  config = {
    PORT: 3000,
    NODE_ENV: "development",
    VERIFICATION_KEY: generateKey(8),
    DB_SECRET: generateKey(16),
    MP_API_KEY: generateKey(32),
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("config.json generated successfully.");
} else {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

// Make config accessible via process.env for compatibility
Object.assign(process.env, config);

module.exports = config;
