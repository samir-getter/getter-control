import type { installCommand, InstallOptions } from "./commands/install.js";
import { detectInstallMode, updateCommand, type InstallMode, type UpdateOptions } from "./commands/update.js";
import { readInstallManifest, resolveInstallStorePaths, type InstallManifest } from "./install-store.js";

export const GETTER_CONTROL_SOURCE_HELP =
  "Getter Control is distributed from source at https://github.com/samir-getter/getter-control. "
  + "Follow its setup guide and run `pnpm getter-control`. "
  + "Managed installation, payload updates, rollback, and system services are unavailable in this source distribution.";

export function rejectGetterManagedDistribution(): never {
  throw new Error(GETTER_CONTROL_SOURCE_HELP);
}

export async function getterInstallCommand(
  _options: InstallOptions,
  _dependencies: { install?: typeof installCommand } = {},
): Promise<void> {
  rejectGetterManagedDistribution();
}

type InstallState = { mode: InstallMode; manifest: InstallManifest | null };

function getInstallState(): InstallState {
  const paths = resolveInstallStorePaths();
  return { mode: detectInstallMode(process.argv[1] ?? "", paths), manifest: readInstallManifest(paths) };
}

export async function getterUpdateCommand(
  options: UpdateOptions,
  dependencies: { update?: typeof updateCommand; getInstallState?: () => InstallState } = {},
): Promise<void> {
  if (options.latest || options.canary || options.version || options.rollback) rejectGetterManagedDistribution();
  const { mode } = (dependencies.getInstallState ?? getInstallState)();
  if (mode === "source" || mode === "unknown") {
    await (dependencies.update ?? updateCommand)(options);
    return;
  }
  rejectGetterManagedDistribution();
}
