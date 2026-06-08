const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = __dirname;
const logPath = path.join(root, "jobexpress-guardian.log");
const nodeExe = process.execPath;
const serverEntry = path.join(root, "server.mjs");
const port = 3000;
const host = "127.0.0.1";

let child = null;
let stopping = false;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logPath, line);
}

function isServerReady() {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/`, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

function startServer() {
  if (child && !child.killed) return;

  log(`Starting Job Express production server on http://${host}:${port}/`);
  const out = fs.openSync(path.join(root, "jobexpress-server.out.log"), "a");
  const err = fs.openSync(path.join(root, "jobexpress-server.err.log"), "a");

  child = spawn(nodeExe, [serverEntry], {
    cwd: root,
    env: {
      ...process.env,
      HOSTNAME: host,
      PORT: String(port),
      NODE_ENV: "production",
    },
    stdio: ["ignore", out, err],
    windowsHide: true,
  });

  child.on("exit", (code, signal) => {
    log(`Server exited code=${code} signal=${signal || ""}`);
    child = null;
    if (!stopping) {
      setTimeout(startServer, 1500);
    }
  });
}

async function monitor() {
  const ready = await isServerReady();
  if (!ready) {
    log("Health check failed; restarting server.");
    if (child && !child.killed) {
      child.kill();
    } else {
      startServer();
    }
  }
}

process.on("SIGINT", () => {
  stopping = true;
  if (child && !child.killed) child.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopping = true;
  if (child && !child.killed) child.kill();
  process.exit(0);
});

log("Guardian started.");
startServer();
setInterval(monitor, 5000);
