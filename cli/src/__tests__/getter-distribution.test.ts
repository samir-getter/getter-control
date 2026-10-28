import { describe, expect, it, vi } from "vitest";
import { getterInstallCommand, getterUpdateCommand } from "../getter-distribution.js";
import type { InstallManifest } from "../install-store.js";

const UNSUPPORTED = "Managed installation, payload updates, rollback, and system services are unavailable";

describe("Getter Control source distribution", () => {
  it.each([
    ["default", {}],
    ["npm canary", { canary: true }],
    ["npm version", { version: "1.2.3" }],
    ["blank ref", { ref: " " }],
    ["fork ref", { ref: "master", repo: "samir-getter/getter-control", yes: true }],
    ["explicit repo", { ref: "master", repo: "other/fork", yes: true }],
  ] as const)("blocks the %s managed installer before execution", async (_name, options) => {
    const install = vi.fn(async () => undefined);
    await expect(getterInstallCommand(options, { install })).rejects.toThrow(UNSUPPORTED);
    expect(install).not.toHaveBeenCalled();
  });

  it.each(["npm", "git"] as const)("blocks managed %s updates, dry runs, and rollback before delegated work", async (source) => {
    const update = vi.fn(async () => undefined);
    for (const options of [{ check: true }, { dryRun: true }, { yes: true }, { rollback: true }]) {
      await expect(getterUpdateCommand(options, {
        update,
        getInstallState: () => ({ mode: "managed", manifest: { source } as InstallManifest }),
      })).rejects.toThrow(UNSUPPORTED);
    }
    expect(update).not.toHaveBeenCalled();
  });

  it.each(["npx", "global-npm"] as const)("blocks %s updates before registry work", async (mode) => {
    const update = vi.fn(async () => undefined);
    await expect(getterUpdateCommand({ check: true }, {
      update,
      getInstallState: () => ({ mode, manifest: null }),
    })).rejects.toThrow(UNSUPPORTED);
    expect(update).not.toHaveBeenCalled();
  });

  it.each(["source", "unknown"] as const)("permits only manual instructions for an unmanaged %s checkout", async (mode) => {
    const update = vi.fn(async () => undefined);
    const options = { check: true };
    await getterUpdateCommand(options, {
      update,
      getInstallState: () => ({ mode, manifest: null }),
    });
    expect(update).toHaveBeenCalledExactlyOnceWith(options);
  });

  it("rejects channels and rollback even from a source checkout, before metadata lookup", async () => {
    const update = vi.fn(async () => undefined);
    const getInstallState = vi.fn(() => ({ mode: "source" as const, manifest: null }));
    for (const options of [{ latest: true }, { canary: true }, { version: "1.2.3" }, { rollback: true }]) {
      await expect(getterUpdateCommand(options, { update, getInstallState })).rejects.toThrow(UNSUPPORTED);
    }
    expect(update).not.toHaveBeenCalled();
    expect(getInstallState).not.toHaveBeenCalled();
  });
});
