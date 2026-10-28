import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkForUpdateNotice, isUpdateNoticeEnabled, printUpdateNotice } from "../update-notice.js";

let root: string;
const ORIGINAL_ENV = { ...process.env };
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), "getter-control-notice-")); });
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

describe("Getter Control update notice", () => {
  it("keeps upstream notices disabled even with a legacy opt-in", async () => {
    process.env.PAPERCLIP_UPDATE_CHECK = "1";
    const configPath = path.join(root, "config.json");
    fs.writeFileSync(configPath, JSON.stringify({ updates: { checkEnabled: true } }));
    const cachePath = path.join(root, "update-check.json");
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ "dist-tags": { latest: "99.0.0" } })));
    expect(isUpdateNoticeEnabled(configPath)).toBe(false);
    expect(await checkForUpdateNotice({ configPath, cachePath, fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(fs.existsSync(cachePath)).toBe(false);
  });

  it("does not announce an upstream update from a preexisting cache", async () => {
    const cachePath = path.join(root, "update-check.json");
    const contents = JSON.stringify({ checkedAt: 1000, latest: "99.0.0" });
    fs.writeFileSync(cachePath, contents);
    expect(await checkForUpdateNotice({ cachePath, now: 2000 })).toBeNull();
    const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await printUpdateNotice();
    expect(output).not.toHaveBeenCalled();
    expect(fs.readFileSync(cachePath, "utf8")).toBe(contents);
  });
});
