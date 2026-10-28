#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function portNumber(value, name) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error(`${name} must be an integer from 1 to 65535.`);
  }
  return Number(value);
}

export function parseOptions(argv, env = process.env) {
  const options = {
    home: env.GETTER_CONTROL_HOME?.trim() || path.join(repoRoot, ".getter-control"),
    port: 3120,
    dbPort: 54349,
    cli: false,
    check: false,
    noUi: false,
    args: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--cli") { options.cli = true; continue; }
    if (arg === "--check") { options.check = true; continue; }
    if (arg === "--no-ui") { options.noUi = true; continue; }
    if (["--home", "--port", "--db-port"].includes(arg)) {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
      if (arg === "--home") options.home = value;
      if (arg === "--port") options.port = portNumber(value, arg);
      if (arg === "--db-port") options.dbPort = portNumber(value, arg);
      continue;
    }
    if (options.cli) { options.args = argv.slice(i); break; }
    throw new Error(`Unknown option ${arg}. Use --home, --port, --db-port, --no-ui or --check.`);
  }
  if (options.home === "~") options.home = os.homedir();
  if (options.home.startsWith("~/") || options.home.startsWith("~\\")) {
    options.home = path.join(os.homedir(), options.home.slice(2));
  }
  options.home = path.resolve(options.home);
  return options;
}

export function instancePaths(home) {
  const root = path.join(home, "instances", "gettercontrol");
  return {
    root,
    config: path.join(root, "config.json"),
    context: path.join(home, "context.json"),
    db: path.join(root, "db"),
    logs: path.join(root, "logs"),
    storage: path.join(root, "data", "storage"),
    backups: path.join(root, "data", "backups"),
    key: path.join(root, "secrets", "master.key"),
  };
}

export function newConfig(options) {
  const paths = instancePaths(options.home);
  return {
    $meta: { version: 1, updatedAt: new Date().toISOString(), source: "configure" },
    database: {
      mode: "embedded-postgres",
      embeddedPostgresDataDir: paths.db,
      embeddedPostgresPort: options.dbPort,
      backup: { enabled: true, intervalMinutes: 60, retentionDays: 7, dir: paths.backups },
    },
    logging: { mode: "file", logDir: paths.logs },
    server: {
      deploymentMode: "local_trusted", exposure: "private", bind: "loopback",
      host: "127.0.0.1", port: options.port, allowedHostnames: [], serveUi: !options.noUi,
    },
    auth: { baseUrlMode: "auto", disableSignUp: false },
    storage: { provider: "local_disk", localDisk: { baseDir: paths.storage } },
    secrets: { provider: "local_encrypted", strictMode: false, localEncrypted: { keyFilePath: paths.key } },
    telemetry: { enabled: false },
    updates: { checkEnabled: false },
  };
}

// Carry OS/process essentials only. Provider credentials, cloud configuration,
// database URLs and another Paperclip instance's overrides need explicit setup.
export function childEnvironment(options, source = process.env) {
  const env = {};
  const essentials = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|TMPDIR|USERPROFILE|HOMEDRIVE|HOMEPATH|HOME|APPDATA|LOCALAPPDATA|LANG|LC_[A-Z_]+|TERM|COLORTERM|NO_COLOR|FORCE_COLOR)$/i;
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && essentials.test(key)) env[key] = value;
  }
  const paths = instancePaths(options.home);
  return {
    ...env,
    GETTER_CONTROL_HOME: options.home,
    GETTER_CONTROL_DEFAULT_SKILLS: "1",
    PAPERCLIP_HOME: options.home,
    PAPERCLIP_INSTANCE_ID: "gettercontrol",
    PAPERCLIP_CONFIG: paths.config,
    PAPERCLIP_CONTEXT: paths.context,
    PAPERCLIP_DISABLE_CWD_ENV_FILE: "true",
    PAPERCLIP_TELEMETRY_DISABLED: "1",
    PAPERCLIP_ANNOUNCEMENTS_ENABLED: "false",
    PAPERCLIP_UPDATE_CHECK: "0",
    PAPERCLIP_OPEN_ON_LISTEN: "false",
    PAPERCLIP_UI_DEV_MIDDLEWARE: options.noUi ? "false" : "true",
    SERVE_UI: options.noUi ? "false" : "true",
    PAPERCLIP_DEPLOYMENT_MODE: "local_trusted",
    PAPERCLIP_BIND: "loopback",
    HOST: "127.0.0.1",
    PORT: String(options.port),
    PAPERCLIP_MIGRATION_AUTO_APPLY: "true",
    PAPERCLIP_MIGRATION_PROMPT: "never",
  };
}

export async function main(argv = process.argv.slice(2)) {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 24 || (major === 24 && minor < 11)) throw new Error("Getter Control requires Node >=24.11.0.");
  const options = parseOptions(argv);
  const paths = instancePaths(options.home);
  const tsx = path.join(repoRoot, "server", "node_modules", "tsx", "dist", "loader.mjs");
  if (!fs.existsSync(tsx)) throw new Error("Install the workspace first: pnpm install --frozen-lockfile (pnpm 9.15.4).");
  for (const target of ["packages/paperclip-runner/dist/index.js", "packages/plugins/sdk/dist/index.js"]) {
    if (!fs.existsSync(path.join(repoRoot, target))) throw new Error("Prepare the source workspace first: pnpm getter-control:prepare.");
  }
  if (options.check) {
    console.log(JSON.stringify({ app: "Getter Control", home: options.home, config: paths.config, url: `http://127.0.0.1:${options.port}`, node: process.versions.node, dependencies: "ready" }, null, 2));
    return;
  }
  fs.mkdirSync(paths.root, { recursive: true });
  if (!fs.existsSync(paths.config)) {
    fs.writeFileSync(paths.config, JSON.stringify(newConfig(options), null, 2) + "\n", { flag: "wx", mode: 0o600 });
  }
  const entry = options.cli ? "cli/src/index.ts" : "scripts/getter-control-server.ts";
  console.log(`Getter Control · http://127.0.0.1:${options.port}\nData: ${options.home}`);
  const child = spawn(process.execPath, ["--import", pathToFileURL(tsx).href, path.join(repoRoot, entry), ...options.args], {
    cwd: repoRoot, env: childEnvironment(options), stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    if (options.cli) child.kill("SIGINT");
    else if (child.connected) child.send({ type: "getter-control:stop" }, () => {});
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const parentMessage = (message) => {
    if (message?.type === "getter-control:stop") stop();
  };
  process.on("message", parentMessage);
  if (process.send) process.once("disconnect", stop);
  child.on("message", (message) => {
    if (message?.type === "getter-control:ready") {
      console.log(`Getter Control ready · ${message.url}`);
      if (process.connected && process.send) process.send(message, (error) => { if (error) stop(); });
    }
  });
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => { process.exitCode = code ?? 1; resolve(); });
  });
  process.removeListener("SIGINT", stop);
  process.removeListener("SIGTERM", stop);
  process.removeListener("message", parentMessage);
  process.removeListener("disconnect", stop);
  if (process.connected && process.disconnect) process.disconnect();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
