import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { childEnvironment, instancePaths, newConfig, parseOptions } from "./getter-control.mjs";

test("source launcher rejects inherited database, cloud, signing and provider state", () => {
  const options = parseOptions(["--home", "./tmp-getter-home", "--port", "3123"], {});
  const env = childEnvironment(options, {
    PATH: "tools", SystemRoot: "C:\\Windows", PAPERCLIP_CONFIG: "old/config.json",
    PAPERCLIP_HOME: "old", PAPERCLIP_CONTEXT: "old/context.json", DATABASE_URL: "postgres://old",
    DATABASE_MIGRATION_URL: "postgres://old", PAPERCLIP_SECRETS_MASTER_KEY: "old",
    PAPERCLIP_CLOUD_TENANT_SERVER_TOKEN: "old", BETTER_AUTH_SECRET: "old",
    OPENAI_API_KEY: "old", CODEX_HOME: "old", OTEL_EXPORTER_OTLP_ENDPOINT: "old", SENTRY_DSN: "old",
  });
  assert.equal(env.PATH, "tools");
  assert.equal(env.SystemRoot, "C:\\Windows");
  assert.equal(env.PAPERCLIP_CONFIG, instancePaths(options.home).config);
  assert.equal(env.PAPERCLIP_HOME, options.home);
  assert.equal(env.PAPERCLIP_CONTEXT, instancePaths(options.home).context);
  for (const key of ["DATABASE_URL", "DATABASE_MIGRATION_URL", "OPENAI_API_KEY", "CODEX_HOME", "PAPERCLIP_CLOUD_TENANT_SERVER_TOKEN", "BETTER_AUTH_SECRET", "PAPERCLIP_SECRETS_MASTER_KEY", "OTEL_EXPORTER_OTLP_ENDPOINT", "SENTRY_DSN"]) assert.equal(env[key], undefined);
  assert.equal(env.HOST, "127.0.0.1");
  assert.equal(env.PAPERCLIP_DISABLE_CWD_ENV_FILE, "true");
  assert.equal(env.PAPERCLIP_TELEMETRY_DISABLED, "1");
});

test("all new instance state is beneath the explicitly selected Getter home", () => {
  const options = parseOptions(["--home", "./tmp-independent-home", "--db-port", "54350"], {});
  const config = newConfig(options);
  for (const target of [config.database.embeddedPostgresDataDir, config.database.backup.dir, config.logging.logDir, config.storage.localDisk.baseDir, config.secrets.localEncrypted.keyFilePath]) {
    const relative = path.relative(options.home, target);
    assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  }
  assert.equal(config.database.embeddedPostgresPort, 54350);
  assert.equal(config.telemetry.enabled, false);
  assert.equal(config.updates.checkEnabled, false);
});

test("own home override and source CLI arguments are explicit", () => {
  assert.equal(parseOptions([], { GETTER_CONTROL_HOME: "./own", PAPERCLIP_HOME: "./foreign" }).home, path.resolve("./own"));
  const options = parseOptions(["--cli", "--home", "./explicit", "auth", "bootstrap-ceo"], {});
  assert.equal(options.home, path.resolve("./explicit"));
  assert.deepEqual(options.args, ["auth", "bootstrap-ceo"]);
  for (const args of [["--port", "0"], ["--port", "3120x"], ["--db-port", "65536"], ["--home"]]) assert.throws(() => parseOptions(args, {}));
});
