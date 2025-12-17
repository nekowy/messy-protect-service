const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  findUserByUsername,
  findUserByIp,
  createUser,
  updateUser,
  getAllUsers,
  countUsers,
  countTasks,
  countBannedUsers,
  createTask,
  getRecentTasks,
  db,
} = require("../utils/db");
const { encrypt, decrypt, hashIp } = require("../utils/encryption");
const { antiVpnMiddleware } = require("../middleware/security");

const DB_SECRET = process.env.DB_SECRET;

module.exports = async function (fastify, opts) {
  // Register routes
  fastify.post(
    "/auth/register",
    {
      preHandler: antiVpnMiddleware,
    },
    async (request, reply) => {
      if (request.isvpn) {
        return reply
          .status(403)
          .send({ error: "VPN/Proxy not allowed for registration." });
      }

      const { username } = request.body;
      const clientIp = request.ip;
      const ipHash = hashIp(clientIp);

      if (!username || username.length < 3) {
        return reply.status(400).send({ error: "Invalid username" });
      }

      try {
        const existingUserByIp = findUserByIp(ipHash);
        if (existingUserByIp) {
          return reply
            .status(429)
            .send({ error: "Only 1 account per IP address allowed." });
        }

        const existingUserByName = findUserByUsername(username);
        if (existingUserByName) {
          return reply.status(409).send({ error: "Username already in use." });
        }

        const rawPassword = crypto.randomBytes(8).toString("hex");
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        const id = crypto.randomUUID();

        createUser(id, username, passwordHash, ipHash);

        return {
          success: true,
          password: rawPassword,
          message: "Account created. Save this password!",
        };
      } catch (e) {
        console.error(e);
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );

  fastify.post("/auth/login", async (request, reply) => {
    const { username, password } = request.body;
    try {
      const user = findUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      if (user.isBanned) {
        return reply.status(403).send({ error: "Access suspended" });
      }

      return {
        success: true,
        username: user.username,
        whitelistedNick: user.whitelistedNick,
      };
    } catch (e) {
      return reply.status(500).send({ error: "Login failed" });
    }
  });

  fastify.post(
    "/user/whitelist",
    {
      preHandler: antiVpnMiddleware,
    },
    async (request, reply) => {
      const { username, password, nick } = request.body;
      if (request.isvpn) {
        return reply.status(403).send({ error: "VPN Detected" });
      }

      try {
        const user = findUserByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          return reply.status(401).send({ error: "Invalid credentials" });
        }

        if (user.isBanned) {
          return reply.status(403).send({ error: "Access suspended" });
        }

        if (user.whitelistedNick) {
          return reply.status(403).send({
            error: "Nickname already set. Contact admin to change.",
          });
        }

        createTask("whitelist", "add", encrypt(nick));
        updateUser(username, { whitelistedNick: nick });

        return { success: true, message: `Nickname updated to ${nick}` };
      } catch (e) {
        console.error(e);
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    }
  );

  fastify.post("/admin/check", async (request, reply) => {
    const { secret } = request.body;
    if (secret === DB_SECRET) {
      return { success: true, admin: true };
    }
    return reply.status(401).send({ success: false });
  });

  fastify.post("/admin/action", async (request, reply) => {
    const { secret, action, target, value } = request.body;

    if (secret !== DB_SECRET) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const user = findUserByUsername(target);
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      if (action === "ban") {
        updateUser(target, { isBanned: 1 });
        if (user.whitelistedNick) {
          createTask("whitelist", "remove", encrypt(user.whitelistedNick));
        }
        return { success: true, message: `Banned ${target}` };
      }

      if (action === "unban") {
        updateUser(target, { isBanned: 0 });
        return { success: true, message: `Unbanned ${target}` };
      }

      if (action === "set_whitelist") {
        if (user.whitelistedNick) {
          createTask("whitelist", "remove", encrypt(user.whitelistedNick));
        }
        createTask("whitelist", "add", encrypt(value));
        updateUser(target, { whitelistedNick: value });
        return {
          success: true,
          message: `Forced whitelist for ${target} to ${value}`,
        };
      }

      if (action === "clear_whitelist") {
        if (user.whitelistedNick) {
          createTask("whitelist", "remove", encrypt(user.whitelistedNick));
          updateUser(target, { whitelistedNick: null });
          return {
            success: true,
            message: `Cleared whitelist for ${target}`,
          };
        }
        return { success: true, message: `User had no whitelist.` };
      }

      return reply.status(400).send({ error: "Invalid action" });
    } catch (e) {
      return reply.status(500).send({ error: "Server Error" });
    }
  });

  fastify.get("/admin/stats", async (request, reply) => {
    const auth = request.headers["x-admin-secret"];
    if (auth !== DB_SECRET) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const users = countUsers();
      const tasks = countTasks();
      const recentTasks = getRecentTasks(10);
      const bannedUsers = countBannedUsers();
      const allUsers = getAllUsers().slice(0, 50);

      const safeTasks = recentTasks.map((t) => ({
        ...t,
        data: decrypt(t.data),
      }));

      return { users, tasks, bannedUsers, recentTasks: safeTasks, allUsers };
    } catch (e) {
      return reply.status(500).send({ error: "Stats Error" });
    }
  });
};
