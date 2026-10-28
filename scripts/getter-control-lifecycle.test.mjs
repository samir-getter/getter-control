import assert from "node:assert/strict";
import { fork } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { repoRoot } from "./getter-control.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "getter-control-ipc-"));
  for (const relative of ["scripts", "server/src", "server/node_modules/tsx/dist", "packages/paperclip-runner/dist", "packages/plugins/sdk/dist", "cli/src/config"]) {
    fs.mkdirSync(path.join(root, relative), { recursive: true });
  }
  fs.writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
  for (const file of ["getter-control.mjs", "getter-control-server.ts"]) fs.copyFileSync(path.join(repoRoot, "scripts", file), path.join(root, "scripts", file));
  for (const relative of ["server/node_modules/tsx/dist/loader.mjs", "packages/paperclip-runner/dist/index.js", "packages/plugins/sdk/dist/index.js"]) fs.writeFileSync(path.join(root, relative), "");
  fs.writeFileSync(path.join(root, "cli/src/config/env.js"), "export function ensureAgentJwtSecret() {}\nexport function ensureToolActionSigningSecret() {}\n");
  fs.writeFileSync(path.join(root, "server/src/index.js"), `
    import fs from 'node:fs';
    import path from 'node:path';
    export async function startServer() {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { listenPort: 3120, shutdown: async () => {
        fs.writeFileSync(path.resolve(import.meta.dirname, '../../shutdown-complete'), 'yes');
      }};
    }
  `);
  return root;
}

async function lifecycle(disconnectDuringStartup) {
  const root = fixture();
  const child = fork(path.join(root, "scripts/getter-control.mjs"), [], { cwd: root, stdio: ["ignore", "ignore", "pipe", "ipc"] });
  let errors = "";
  child.stderr.on("data", (data) => { errors += data; });
  const exit = new Promise((resolve) => child.once("exit", (code) => resolve(code)));
  const deadline = (promise) => Promise.race([promise, new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("IPC lifecycle did not finish")), 10_000); timer.unref(); })]);
  try {
    if (disconnectDuringStartup) child.disconnect();
    else {
      await deadline(new Promise((resolve, reject) => {
        child.on("message", (message) => { if (message?.type === "getter-control:ready") resolve(); });
        child.once("exit", (code) => reject(new Error(`Early exit ${code}: ${errors}`)));
      }));
      child.send({ type: "getter-control:stop" });
    }
    assert.equal(await deadline(exit), 0, errors);
    assert.equal(fs.readFileSync(path.join(root, "shutdown-complete"), "utf8"), "yes");
    assert.doesNotMatch(errors, /ERR_IPC_CHANNEL_CLOSED/);
  } finally {
    if (child.exitCode === null) child.kill();
    const relative = path.relative(os.tmpdir(), root);
    if (!relative.startsWith("getter-control-ipc-") || path.isAbsolute(relative) || relative.includes("..")) throw new Error("Unexpected fixture path");
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("forked source launcher releases IPC after ordered child shutdown", () => lifecycle(false));
test("parent disconnect during startup still shuts the source server down", () => lifecycle(true));
