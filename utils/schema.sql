-- Users table
CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    ipHash TEXT UNIQUE NOT NULL,
    whitelistedNick TEXT,
    isBanned INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- Tasks table
CREATE TABLE IF NOT EXISTS Task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    action TEXT NOT NULL,
    data TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
);

-- Admin table
CREATE TABLE IF NOT EXISTS Admin (
    id INTEGER PRIMARY KEY DEFAULT 1,
    passwordHash TEXT NOT NULL
);

-- Config table  
CREATE TABLE IF NOT EXISTS Config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_username ON User(username);
CREATE INDEX IF NOT EXISTS idx_user_banned ON User(isBanned);
CREATE INDEX IF NOT EXISTS idx_task_created ON Task(createdAt);
