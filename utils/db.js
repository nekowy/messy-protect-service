const { Database } = require("bun:sqlite");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database/database.db");
const schemaPath = path.join(__dirname, "schema.sql");

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Run schema if database is new
if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
  console.log("Initializing database schema...");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);
  console.log("Database schema initialized.");
}

// Helper functions for common queries
const dbHelpers = {
  // Users
  findUserByUsername: (username) => {
    return db.query("SELECT * FROM User WHERE username = ?").get(username);
  },

  findUserByIp: (ipHash) => {
    return db.query("SELECT * FROM User WHERE ipHash = ?").get(ipHash);
  },

  createUser: (id, username, passwordHash, ipHash) => {
    return db
      .query(
        "INSERT INTO User (id, username, passwordHash, ipHash) VALUES (?, ?, ?, ?)"
      )
      .run(id, username, passwordHash, ipHash);
  },

  updateUser: (username, updates) => {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), username];
    return db
      .query(
        `UPDATE User SET ${fields}, updatedAt = datetime('now') WHERE username = ?`
      )
      .run(...values);
  },

  countUsers: () => {
    return db.query("SELECT COUNT(*) as count FROM User").get().count;
  },

  countBannedUsers: () => {
    return db
      .query("SELECT COUNT(*) as count FROM User WHERE isBanned = 1")
      .get().count;
  },

  getAllUsers: () => {
    return db.query("SELECT * FROM User ORDER BY createdAt DESC").all();
  },

  // Tasks
  createTask: (type, action, data) => {
    return db
      .query("INSERT INTO Task (type, action, data) VALUES (?, ?, ?)")
      .run(type, action, data);
  },

  getAllTasks: () => {
    return db.query("SELECT * FROM Task ORDER BY createdAt DESC").all();
  },

  getRecentTasks: (limit = 100) => {
    return db
      .query("SELECT * FROM Task ORDER BY createdAt DESC LIMIT ?")
      .all(limit);
  },

  deleteTask: (id) => {
    return db.query("DELETE FROM Task WHERE id = ?").run(id);
  },

  countTasks: () => {
    return db.query("SELECT COUNT(*) as count FROM Task").get().count;
  },
};

module.exports = { db, ...dbHelpers };
