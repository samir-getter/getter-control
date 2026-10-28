import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  resolveDefaultBackupDir,
  resolveDefaultEmbeddedPostgresDir,
  resolveDefaultLogsDir,
  resolveDefaultSecretsKeyFilePath,
  resolveDefaultStorageDir,
  resolvePaperclipConfigPathForInstance,
  resolvePaperclipHomeDir,
  resolvePaperclipInstanceRoot,
} from "./home-paths.js";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => { delete process.env.GETTER_CONTROL_HOME; });

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("home path resolution", () => {
  it("defaults to a Getter Control home without an upstream home override", () => {
    delete process.env.PAPERCLIP_HOME;
    expect(resolvePaperclipHomeDir()).toBe(path.resolve(os.homedir(), ".getter-control"));
  });

  it("prefers an explicit path, then Getter Control home, then the legacy alias", () => {
    process.env.PAPERCLIP_HOME = "~/legacy-paperclip";
    process.env.GETTER_CONTROL_HOME = "~/getter-control-private";
    expect(resolvePaperclipHomeDir()).toBe(path.resolve(os.homedir(), "getter-control-private"));
    expect(resolvePaperclipHomeDir("~/explicit-home")).toBe(path.resolve(os.homedir(), "explicit-home"));
    process.env.GETTER_CONTROL_HOME = "   ";
    expect(resolvePaperclipHomeDir()).toBe(path.resolve(os.homedir(), "legacy-paperclip"));
  });

  it("resolves config and runtime data directly under the instance root", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "paperclip-home-paths-"));
    process.env.PAPERCLIP_HOME = home;
    delete process.env.PAPERCLIP_INSTANCE_ID;

    const instanceRoot = path.join(home, "instances", "default");
    expect(resolvePaperclipInstanceRoot()).toBe(instanceRoot);
    expect(resolvePaperclipConfigPathForInstance()).toBe(path.join(instanceRoot, "config.json"));
    expect(resolveDefaultEmbeddedPostgresDir()).toBe(path.join(instanceRoot, "db"));
    expect(resolveDefaultBackupDir()).toBe(path.join(instanceRoot, "data", "backups"));
    expect(resolveDefaultLogsDir()).toBe(path.join(instanceRoot, "logs"));
    expect(resolveDefaultStorageDir()).toBe(path.join(instanceRoot, "data", "storage"));
    expect(resolveDefaultSecretsKeyFilePath()).toBe(path.join(instanceRoot, "secrets", "master.key"));
  });
});
