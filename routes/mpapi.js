const { getAllTasks, deleteTask } = require("../utils/db");
const { decrypt } = require("../utils/encryption");
const { authenticatePlugin } = require("../middleware/security");

const VERIFICATION_KEY = process.env.VERIFICATION_KEY;

module.exports = async function (fastify, opts) {
  // Add authentication hook
  fastify.addHook("preHandler", authenticatePlugin);

  fastify.get("/tasks", async (request, reply) => {
    try {
      const tasks = getAllTasks();
      const plainTasks = tasks.map((t) => ({
        id: t.id,
        type: t.type,
        action: t.action,
        data: decrypt(t.data),
      }));

      return { tasks: plainTasks, verify: VERIFICATION_KEY };
    } catch (e) {
      return reply
        .status(500)
        .send({ error: "DB Error", verify: VERIFICATION_KEY });
    }
  });

  fastify.get("/complete", async (request, reply) => {
    const taskId = parseInt(request.query.task);
    if (isNaN(taskId)) {
      return reply
        .status(400)
        .send({ error: "Invalid ID", verify: VERIFICATION_KEY });
    }

    try {
      deleteTask(taskId);
      return { success: true, verify: VERIFICATION_KEY };
    } catch (e) {
      return {
        success: false,
        error: "Task not found",
        verify: VERIFICATION_KEY,
      };
    }
  });
};
