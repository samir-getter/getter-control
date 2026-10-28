import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePaperclipConfigPath, resolvePaperclipEnvPath } from "../paths.js";

let root: string;
const ORIGINAL_CWD = process.cwd();
const ORIGINAL_ENV = { ...process.env };
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "getter-control-server-config-"));
  const nested = path.join(root, "repo", "nested");
  fs.mkdirSync(nested, { recursive: true });
  process.chdir(nested);
  process.env.GETTER_CONTROL_HOME = path.join(root, "home");
  delete process.env.PAPERCLIP_CONFIG;
  delete process.env.PAPERCLIP_INSTANCE_ID;
  delete process.env.PAPERCLIP_IN_WORKTREE;
  const existsSync = fs.existsSync;
  vi.spyOn(fs, "existsSync").mockImplementation((candidate) => {
    const resolved = path.resolve(String(candidate));
    return resolved === root || resolved.startsWith(root + path.sep) ? existsSync(candidate) : false;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  process.chdir(ORIGINAL_CWD);
  process.env = { ...ORIGINAL_ENV };
  fs.rmSync(root, { recursive: true, force: true });
});

describe("Getter Control server config discovery", () => {
  it("ignores upstream config and env files in ancestors", () => {
    const legacy = path.join(root, "repo", ".paperclip");
    fs.mkdirSync(legacy);
    fs.writeFileSync(path.join(legacy, "config.json"), "upstream-placeholder");
    fs.writeFileSync(path.join(legacy, ".env"), "UPSTREAM_PLACEHOLDER=true");
    expect(resolvePaperclipConfigPath()).toBe(path.join(root, "home", "instances", "default", "config.json"));
    expect(resolvePaperclipEnvPath()).toBe(path.join(root, "home", "instances", "default", ".env"));
  });

  it("discovers Getter Control config while explicit selections take precedence", () => {
    const own = path.join(root, "repo", ".getter-control");
    fs.mkdirSync(own);
    fs.writeFileSync(path.join(own, "config.json"), "{}");
    expect(resolvePaperclipConfigPath()).toBe(path.join(own, "config.json"));
    process.env.PAPERCLIP_CONFIG = path.join(root, "selected", "config.json");
    expect(resolvePaperclipConfigPath()).toBe(process.env.PAPERCLIP_CONFIG);
    expect(resolvePaperclipConfigPath(path.join(root, "flag", "config.json"))).toBe(path.join(root, "flag", "config.json"));
  });

  it("discovers the nearest persisted legacy worktree before a parent Getter config", () => {
    const parent = path.join(root, "repo", ".getter-control");
    fs.mkdirSync(parent);
    fs.writeFileSync(path.join(parent, "config.json"), "{}");
    const worktree = path.join(process.cwd(), ".paperclip");
    fs.mkdirSync(worktree);
    fs.writeFileSync(path.join(worktree, "config.json"), "{}");
    fs.writeFileSync(path.join(worktree, ".env"), 'export PAPERCLIP_IN_WORKTREE="true"');
    expect(resolvePaperclipConfigPath()).toBe(path.join(worktree, "config.json"));
    expect(resolvePaperclipEnvPath()).toBe(path.join(worktree, ".env"));
    expect(process.env.PAPERCLIP_IN_WORKTREE).toBeUndefined();
    process.env.PAPERCLIP_CONFIG = path.join(root, "selected", "config.json");
    expect(resolvePaperclipConfigPath()).toBe(process.env.PAPERCLIP_CONFIG);
    expect(resolvePaperclipConfigPath(path.join(root, "flag", "config.json"))).toBe(path.join(root, "flag", "config.json"));
  });

  it("prefers same-level Getter config over a marked legacy worktree", () => {
    for (const name of [".getter-control", ".paperclip"]) {
      const folder = path.join(process.cwd(), name);
      fs.mkdirSync(folder);
      fs.writeFileSync(path.join(folder, "config.json"), "{}");
      fs.writeFileSync(path.join(folder, ".env"), "PAPERCLIP_IN_WORKTREE=true");
    }
    expect(resolvePaperclipConfigPath()).toBe(path.join(process.cwd(), ".getter-control", "config.json"));
  });

  it("ignores a persisted false legacy marker even with an ambient worktree flag", () => {
    const legacy = path.join(root, "repo", ".paperclip");
    fs.mkdirSync(legacy);
    fs.writeFileSync(path.join(legacy, "config.json"), "{}");
    fs.writeFileSync(path.join(legacy, ".env"), "PAPERCLIP_IN_WORKTREE=true\nPAPERCLIP_IN_WORKTREE=false");
    process.env.PAPERCLIP_IN_WORKTREE = "true";
    expect(resolvePaperclipConfigPath()).toBe(path.join(root, "home", "instances", "default", "config.json"));
    expect(resolvePaperclipEnvPath()).toBe(path.join(root, "home", "instances", "default", ".env"));
  });
});
