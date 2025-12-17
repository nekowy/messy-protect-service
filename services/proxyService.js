const axios = require("axios");
const { cleanProxyLine } = require("../utils/proxy");

const knownProxies = new Set();
const proxySources = [
  "https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks4.txt",
  "https://www.proxyscan.io/download?type=socks4",
  "https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks4&timeout=10000&country=all",
  "https://api.openproxylist.xyz/socks4.txt",
  "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks4.txt",
  "https://raw.githubusercontent.com/roosterkid/openproxylist/main/SOCKS4_RAW.txt",
  "https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt",
  "https://www.proxyscan.io/download?type=socks5",
  "https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5&timeout=10000&country=all",
  "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt",
  "https://raw.githubusercontent.com/roosterkid/openproxylist/main/SOCKS5_RAW.txt",
];

async function updateProxyList() {
  console.log("Updating proxy list...");
  try {
    for (const url of proxySources) {
      try {
        const res = await axios.get(url, { timeout: 5000 });
        const lines = res.data.toString().split("\n");
        for (const line of lines) {
          const cleaned = cleanProxyLine(line);
          if (cleaned) {
            knownProxies.add(cleaned);
          }
        }
      } catch (e) {
        continue;
      }
    }
    console.log(`Proxy list updated. Count: ${knownProxies.size}`);
  } catch (err) {
    console.error("Proxy update failed:", err.message);
  }
}

updateProxyList();
setInterval(updateProxyList, 1000 * 60 * 30);

module.exports = { knownProxies };