const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const configPath = path.join(__dirname, "../database", "config.json");

const dbDir = path.dirname(configPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const generateKey = (len) =>
  crypto
    .randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len);

const defaultConfig = {
  PORT: 3000,
  NODE_ENV: "development",
  VERIFICATION_KEY: generateKey(16),
  DB_SECRET: generateKey(32),
  MP_API_KEY: generateKey(64),
};

let config = {};
let shouldWrite = false;

if (!fs.existsSync(configPath)) {
  console.log("config.json not found. Generating...");
  config = { ...defaultConfig };
  shouldWrite = true;
} else {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  for (const [key, value] of Object.entries(defaultConfig)) {
    if (!(key in config)) {
      config[key] = ["VERIFICATION_KEY", "DB_SECRET", "MP_API_KEY"].includes(key)
        ? generateKey(parseInt(key === "VERIFICATION_KEY" ? 16 : key === "DB_SECRET" ? 32 : 64))
        : value;
      shouldWrite = true;
    }
  }
}

if (shouldWrite) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  if (!fs.existsSync(configPath)) {
    console.log("config.json generated successfully.");
  } else {
    console.log("config.json updated with missing keys.");
  }
}

Object.assign(process.env, config);
module.exports = config;
