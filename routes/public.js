const path = require("path");

module.exports = async function (fastify, opts) {
  fastify.get("/admin", async (request, reply) => {
    return reply.sendFile("admin.html");
  });
};
