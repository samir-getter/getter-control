import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFrontmatterMarkdown } from "./frontmatter.js";
import { resolveCatalogSkillRef } from "./index.js";

const HALLMARK_ROOT = fileURLToPath(new URL("../catalog/bundled/design/hallmark", import.meta.url));
const UPSTREAM_COMMIT = "6033bab2a8051b5454552d2e8e6cb8f27c483a42";
const UPSTREAM_ENTRYPOINT_SHA256 = "25a1ff92d925b2389e8409f42fb8ad7e033fceca8b5d1f07ed4ca4c28da53dc3";
const UPSTREAM_PAYLOAD_SHA256 = "362ca466b1817ed1a569443752a30f04d3ed4c97a5a1752bcd8a976c5479cc23";

function sha256(bytes: string | Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

function listPayloadFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    return entry.isDirectory() ? listPayloadFiles(filePath) : [filePath];
  });
}

function restoreUpstreamEntrypoint(markdown: string) {
  // Only catalog registration/provenance fields are added to the upstream entry.
  // Removing them lets this test verify the entire official file byte for byte.
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, (frontmatter) => frontmatter
    .replace(/^(?:key|defaultInstall|recommendedForRoles|requires|tags|authorName|homepageUrl):[^\n]*\n/gm, "")
    .replace(/^  source(?:Repository|Commit|Path|Version|License|SkillSha256):[^\n]*\n/gm, ""));
}

describe("Hallmark catalog provenance", () => {
  it("registers the pinned official skill as a company default without changing its invocation contract", () => {
    const skill = resolveCatalogSkillRef("hallmark");
    expect(skill).toMatchObject({
      id: "paperclipai:bundled:design:hallmark",
      key: "paperclipai/bundled/design/hallmark",
      defaultInstall: true,
      trustLevel: "scripts_executables",
      recommendedForRoles: ["designer", "engineer", "product"],
      requires: ["node"],
      tags: ["design", "frontend", "ui", "hallmark"],
    });

    const markdown = readFileSync(path.join(HALLMARK_ROOT, "SKILL.md"), "utf8");
    expect(parseFrontmatterMarkdown(markdown).frontmatter).toMatchObject({
      name: "hallmark",
      "argument-hint": "<prompt> | redesign <path> | audit <path>",
      version: "2.0.0",
      authorName: "Hallmark contributors",
      homepageUrl: "https://github.com/Nutlope/hallmark",
      metadata: {
        "opencode/slash": "true",
        sourceRepository: "https://github.com/Nutlope/hallmark",
        sourceCommit: UPSTREAM_COMMIT,
        sourcePath: "skills/hallmark",
        sourceVersion: "2.0.0",
        sourceLicense: "MIT",
        sourceSkillSha256: UPSTREAM_ENTRYPOINT_SHA256,
      },
    });
    expect(skill?.description).toContain("Never use it on an existing design unless the user names Hallmark");
    expect(skill?.files.filter((file) => file.path.endsWith(".jpg") && file.kind === "asset"))
      .toHaveLength(50);
    expect(sha256(restoreUpstreamEntrypoint(markdown))).toBe(UPSTREAM_ENTRYPOINT_SHA256);
  });

  it("ships the official 165-file installer payload with its license, helpers, and theme previews intact", () => {
    const inventory = listPayloadFiles(HALLMARK_ROOT).map((filePath) => {
      const relativePath = path.relative(HALLMARK_ROOT, filePath).split(path.sep).join("/");
      const bytes = readFileSync(filePath);
      return {
        path: relativePath,
        sha256: sha256(relativePath === "SKILL.md" ? restoreUpstreamEntrypoint(bytes.toString("utf8")) : bytes),
      };
    }).sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);

    expect(inventory).toHaveLength(165);
    expect(inventory.filter((file) => file.path.startsWith("scripts/fixtures/"))).toEqual([]);
    expect(inventory.filter((file) => file.path.endsWith(".mjs"))).toHaveLength(10);
    expect(inventory.filter((file) => file.path.endsWith(".jpg"))).toHaveLength(50);
    expect(sha256(JSON.stringify(inventory))).toBe(UPSTREAM_PAYLOAD_SHA256);
    expect(inventory.find((file) => file.path === "LICENSE")?.sha256)
      .toBe("06088a8b94598626f27612dea42300154bf7be967c85d9d3eee4490cb056af7d");
    expect(inventory.find((file) => file.path === "agents/openai.yaml")?.sha256)
      .toBe("0bc6fa7d573c926e8d3fe04a5afc8191096e5aa7287598a59b6c7e6321b53298");
  });
});
