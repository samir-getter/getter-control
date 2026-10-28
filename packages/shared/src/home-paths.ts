import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const DEFAULT_PAPERCLIP_INSTANCE_ID = "default";
export const PAPERCLIP_CONFIG_BASENAME = "config.json";
export const PAPERCLIP_ENV_FILENAME = ".env";

const PATH_SEGMENT_RE = /^[a-zA-Z0-9_-]+$/;

function isAttestedLegacyWorktreeConfig(configPath: string): boolean {
  let contents: string;
  try {
    contents = fs.readFileSync(path.join(path.dirname(configPath), PAPERCLIP_ENV_FILENAME), "utf8");
  } catch {
    return false;
  }
  let marker: string | undefined;
  for (const rawLine of contents.split(/\r?\n/)) {
    const match = rawLine.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] !== "PAPERCLIP_IN_WORKTREE") continue;
    const value = match[2].trim();
    marker = ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      ? value.slice(1, -1)
      : value.replace(/\s+#.*$/, "").trim();
  }
  return marker === "true";
}

export function findPaperclipConfigFileFromAncestors(startDir: string): string | null {
  let currentDir = path.resolve(startDir);
  while (true) {
    const ownConfig = path.join(currentDir, ".getter-control", PAPERCLIP_CONFIG_BASENAME);
    if (fs.existsSync(ownConfig)) return ownConfig;
    const worktreeConfig = path.join(currentDir, ".paperclip", PAPERCLIP_CONFIG_BASENAME);
    if (fs.existsSync(worktreeConfig) && isAttestedLegacyWorktreeConfig(worktreeConfig)) return worktreeConfig;
    const parentDir = path.resolve(currentDir, "..");
    if (parentDir === currentDir) return null;
    currentDir = parentDir;
  }
}

export function expandHomePrefix(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.resolve(os.homedir(), value.slice(2));
  return value;
}

export function resolvePaperclipHomeDir(homeOverride?: string): string {
  const raw = homeOverride?.trim()
    || process.env.GETTER_CONTROL_HOME?.trim()
    || process.env.PAPERCLIP_HOME?.trim();
  if (raw) return path.resolve(expandHomePrefix(raw));
  return path.resolve(os.homedir(), ".getter-control");
}

export function resolvePaperclipInstanceId(instanceIdOverride?: string): string {
  const raw = instanceIdOverride?.trim() || process.env.PAPERCLIP_INSTANCE_ID?.trim() || DEFAULT_PAPERCLIP_INSTANCE_ID;
  if (!PATH_SEGMENT_RE.test(raw)) {
    throw new Error(`Invalid PAPERCLIP_INSTANCE_ID '${raw}'.`);
  }
  return raw;
}

export function resolvePaperclipInstanceRoot(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolvePaperclipHomeDir(input.homeDir), "instances", resolvePaperclipInstanceId(input.instanceId));
}

export function resolvePaperclipInstanceConfigPath(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolvePaperclipInstanceRoot(input), PAPERCLIP_CONFIG_BASENAME);
}

export function resolvePaperclipConfigPathForInstance(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return resolvePaperclipInstanceConfigPath(input);
}

export function resolvePaperclipEnvPathForConfig(configPath: string): string {
  return path.resolve(path.dirname(configPath), PAPERCLIP_ENV_FILENAME);
}

export function resolveDefaultEmbeddedPostgresDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolvePaperclipInstanceRoot(input), "db");
}

export function resolveDefaultLogsDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolvePaperclipInstanceRoot(input), "logs");
}

export function resolveDefaultSecretsKeyFilePath(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolvePaperclipInstanceRoot(input), "secrets", "master.key");
}

export function resolveDefaultStorageDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolvePaperclipInstanceRoot(input), "data", "storage");
}

export function resolveDefaultBackupDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolvePaperclipInstanceRoot(input), "data", "backups");
}

export function resolveHomeAwarePath(value: string): string {
  return path.resolve(expandHomePrefix(value));
}
