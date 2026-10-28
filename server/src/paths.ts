import path from "node:path";
import { findPaperclipConfigFileFromAncestors } from "@paperclipai/shared/home-paths";
import { resolveDefaultConfigPath } from "./home-paths.js";

const PAPERCLIP_ENV_FILENAME = ".env";

export function resolvePaperclipConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.PAPERCLIP_CONFIG) return path.resolve(process.env.PAPERCLIP_CONFIG);
  return findPaperclipConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolvePaperclipEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolvePaperclipConfigPath(overrideConfigPath)), PAPERCLIP_ENV_FILENAME);
}
