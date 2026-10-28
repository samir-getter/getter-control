// IPC gives the source launcher an orderly shutdown on Windows as well as POSIX.
let stopRequested = false;
let runtime: Awaited<ReturnType<typeof import("../server/src/index.js").startServer>> | undefined;
let stopping: Promise<void> | undefined;
function stop() {
  stopRequested = true;
  if (!runtime || stopping) return;
  stopping = runtime.shutdown().then(() => process.exit(0)).catch((error) => {
    console.error("Getter Control shutdown failed:", error);
    process.exit(1);
  });
}
process.on("message", (message) => {
  if (message && typeof message === "object" && "type" in message && message.type === "getter-control:stop") stop();
});
process.once("disconnect", stop);
try {
  console.log("Getter Control: loading the source server...");
  const { ensureAgentJwtSecret, ensureToolActionSigningSecret } = await import("../cli/src/config/env.js");
  const configPath = process.env.PAPERCLIP_CONFIG;
  if (!configPath) throw new Error("Getter Control requires its explicit config path.");
  ensureAgentJwtSecret(configPath);
  ensureToolActionSigningSecret(configPath);
  const { startServer } = await import("../server/src/index.js");
  runtime = await startServer();
  if (stopRequested) stop();
  else if (process.connected) process.send?.(
    { type: "getter-control:ready", url: `http://127.0.0.1:${runtime.listenPort}`, pid: process.pid },
    (error) => { if (error) stop(); },
  );
} catch (error) {
  console.error("Getter Control failed to start:", error);
  process.exit(1);
}
