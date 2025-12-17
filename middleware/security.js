const axios = require("axios");
const { knownProxies } = require("../services/proxyService");

const MP_API_KEY = process.env.MP_API_KEY;

// Fastify middleware for anti-VPN
async function antiVpnMiddleware(request, reply) {
  request.isvpn = false;
  const ip = request.ip;
  const cleanIp = ip.replace("::ffff:", "").trim();

  if (knownProxies.has(cleanIp)) {
    return reply.status(403).send({ error: "Access Denied: Proxy Detected" });
  }

  try {
    const { data } = await axios.get(
      `http://ip-api.com/json/${cleanIp}?fields=status,proxy,hosting`,
      { timeout: 2000 }
    );
    if (data.status === "success" && (data.proxy || data.hosting)) {
      request.isvpn = true;
    }
  } catch (e) {}
}

// Fastify middleware for plugin authentication
const authenticatePlugin = async (request, reply) => {
  const apiKey = request.headers["mp-api-key"];
  if (!apiKey || apiKey !== MP_API_KEY) {
    return reply.status(403).send({ error: "Invalid API Key" });
  }
};

module.exports = { antiVpnMiddleware, authenticatePlugin };
