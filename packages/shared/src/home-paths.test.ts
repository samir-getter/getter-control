import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findPaperclipConfigFileFromAncestors,
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

describe("ancestor config discovery", () => {
  let fixture: string;
  let nested: string;
  let fallback: string;
  beforeEach(() => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), "getter-control-discovery-"));
    nested = path.join(fixture, "repo", "nested");
    fs.mkdirSync(nested, { recursive: true });
    const own = path.join(fixture, ".getter-control");
    fs.mkdirSync(own);
    fallback = path.join(own, "config.json");
    fs.writeFileSync(fallback, "{}");
    delete process.env.PAPERCLIP_IN_WORKTREE;
  });
  afterEach(() => {
    expect(path.dirname(fixture)).toBe(os.tmpdir());
    fs.rmSync(fixture, { recursive: true, force: true });
  });

  function legacyConfig(contents?: string): string {
    const folder = path.join(nested, ".paperclip");
    fs.mkdirSync(folder);
    const config = path.join(folder, "config.json");
    fs.writeFileSync(config, "{}");
    if (contents !== undefined) fs.writeFileSync(path.join(folder, ".env"), contents);
    return config;
  }

  it.each([
    "PAPERCLIP_IN_WORKTREE=true",
    "export PAPERCLIP_IN_WORKTREE='true'",
    '  export PAPERCLIP_IN_WORKTREE = "true"\r\n',
    "PAPERCLIP_IN_WORKTREE=true # worktree",
    "PAPERCLIP_IN_WORKTREE=false\nPAPERCLIP_IN_WORKTREE=true",
  ])("recognizes its own persisted worktree marker as data: %s", (contents) => {
    const config = legacyConfig(contents);
    expect(findPaperclipConfigFileFromAncestors(path.join(nested, "child"))).toBe(config);
    expect(process.env.PAPERCLIP_IN_WORKTREE).toBeUndefined();
  });

  it.each([
    undefined,
    "PAPERCLIP_IN_WORKTREE=false",
    "PAPERCLIP_IN_WORKTREE='false'",
    "PAPERCLIP_IN_WORKTREE=true\nPAPERCLIP_IN_WORKTREE=false",
    "# PAPERCLIP_IN_WORKTREE=true",
    'PAPERCLIP_IN_WORKTREE="${PAPERCLIP_IN_WORKTREE}"',
    "PAPERCLIP_IN_WORKTREE=true#comment",
    'PAPERCLIP_IN_WORKTREE="true" # comment',
  ])("ignores unmarked or false legacy configs despite an ambient flag: %s", (contents) => {
    legacyConfig(contents);
    process.env.PAPERCLIP_IN_WORKTREE = "true";
    expect(findPaperclipConfigFileFromAncestors(nested)).toBe(fallback);
  });

  it("prefers Getter config at the same level and the nearest config before its parent", () => {
    const legacy = legacyConfig("PAPERCLIP_IN_WORKTREE=true");
    expect(findPaperclipConfigFileFromAncestors(nested)).toBe(legacy);
    const own = path.join(nested, ".getter-control");
    fs.mkdirSync(own);
    const config = path.join(own, "config.json");
    fs.writeFileSync(config, "{}");
    expect(findPaperclipConfigFileFromAncestors(nested)).toBe(config);
  });

  it("ignores a legacy config when its own marker path cannot be read as a file", () => {
    const config = legacyConfig();
    fs.mkdirSync(path.join(path.dirname(config), ".env"));
    expect(findPaperclipConfigFileFromAncestors(nested)).toBe(fallback);
  });
});
