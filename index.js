// Load configuration (auto-generates database/config.json if missing)
require("./utils/config");

const fastify = require("fastify")({ logger: false });
const fastifyStatic = require("@fastify/static");
const fastifyCors = require("@fastify/cors");
const path = require("path");

// Initialize database (creates schema if needed)
require("./utils/db");

// Start proxy service
require("./services/proxyService");

const apiRoutes = require("./routes/api");
const mpApiRoutes = require("./routes/mpapi");
const publicRoutes = require("./routes/public");

const API_PORT = process.env.PORT || 31193;

// Register plugins
fastify.register(fastifyCors, { origin: "*" });
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

// Register routes
fastify.register(apiRoutes, { prefix: "/api" });
fastify.register(mpApiRoutes, { prefix: "/mpapi" });
fastify.register(publicRoutes);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: API_PORT, host: "0.0.0.0" });
    console.log(`Server running on port ${API_PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
