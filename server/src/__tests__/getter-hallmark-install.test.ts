import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { agents, companies, companySkills, createDb, resourceLifecycleEvents } from "@paperclipai/db";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getCatalogSkillOrThrow } from "../services/skills-catalog.js";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "./helpers/embedded-postgres.js";

const support = await getEmbeddedPostgresTestSupport();
const describeDatabase = support.supported ? describe : describe.skip;

describeDatabase("Getter Hallmark installation with the shipped package", () => {
  let database: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>>;
  let db: ReturnType<typeof createDb>;
  let home: string;
  let defaults: ReturnType<typeof import("../services/company-catalog-defaults.js").companyCatalogDefaultsService>;
  let skills: ReturnType<typeof import("../services/company-skills.js").companySkillService>;
  beforeAll(async () => {
    home = await fs.mkdtemp(path.join(os.tmpdir(), "getter-hallmark-home-"));
    vi.stubEnv("GETTER_CONTROL_HOME", home);
    vi.stubEnv("PAPERCLIP_HOME", home);
    database = await startEmbeddedPostgresTestDatabase("getter-hallmark-package-");
    db = createDb(database.connectionString);
    const { companyCatalogDefaultsService } = await import("../services/company-catalog-defaults.js");
    const { companySkillService, classifyInventoryKind } = await import("../services/company-skills.js");
    expect(classifyInventoryKind("references/theme.jpg")).toBe("asset");
    expect(classifyInventoryKind("references/checklist.md")).toBe("reference");
    expect(classifyInventoryKind("references/check.mjs")).toBe("script");
    expect(classifyInventoryKind("scripts/preview.jpg")).toBe("script");
    defaults = companyCatalogDefaultsService(db);
    skills = companySkillService(db);
  }, 90_000);
  afterAll(async () => {
    vi.restoreAllMocks();
    await database?.cleanup();
    vi.unstubAllEnvs();
    if (home) await fs.rm(home, { recursive: true, force: true });
  });

  it("installs all pinned bytes offline, invalidates only selected company agents, and prepares an immutable runtime snapshot", async () => {
    const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network disabled during Hallmark install proof"));
    const catalog = getCatalogSkillOrThrow("hallmark");
    expect(catalog.defaultInstall).toBe(true);
    expect(catalog.files).toHaveLength(165);
    const companyId = randomUUID();
    const otherCompanyId = randomUUID();
    await db.insert(companies).values([
      { id: companyId, name: "Hallmark package proof", issuePrefix: "HALL" },
      { id: otherCompanyId, name: "Separate company", issuePrefix: "OTHER" },
    ]);
    const selectedConfig = { paperclipSkillSync: { desiredSkills: [catalog.key] } };
    const [selected, unselected, other] = await db.insert(agents).values([
      { companyId, name: "Selected designer", adapterType: "paperclip_runner", adapterConfig: selectedConfig },
      { companyId, name: "Unselected designer", adapterType: "paperclip_runner", adapterConfig: { paperclipSkillSync: { desiredSkills: [] } } },
      { companyId: otherCompanyId, name: "Other company designer", adapterType: "paperclip_runner", adapterConfig: selectedConfig },
    ]).returning();
    const events = () => db.select().from(resourceLifecycleEvents)
      .where(eq(resourceLifecycleEvents.resourceType, "agent_runtime")).orderBy(resourceLifecycleEvents.id);
    const before = (await events()).length;

    expect(await defaults.syncCompany(companyId)).toEqual([
      expect.objectContaining({ companyId, key: catalog.key, status: "installed" }),
    ]);
    const installationEvents = (await events()).slice(before);
    expect(installationEvents.length).toBeGreaterThan(0);
    expect(new Set(installationEvents.map(event => event.resourceId))).toEqual(new Set([selected.id]));
    expect(installationEvents.every(event => event.companyId === companyId)).toBe(true);
    const [installed] = await db.select().from(companySkills)
      .where(and(eq(companySkills.companyId, companyId), eq(companySkills.key, catalog.key)));
    expect(installed).toMatchObject({ trustLevel: "scripts_executables", sourceType: "catalog",
      metadata: expect.objectContaining({ originHash: catalog.contentHash, installedHash: catalog.contentHash, auditVerdict: "warning" }) });
    expect(installed.sourceLocator).toBeTruthy();
    expect(path.resolve(installed.sourceLocator!).startsWith(`${path.resolve(home)}${path.sep}`)).toBe(true);
    for (const file of catalog.files) {
      const bytes = await fs.readFile(`${installed.sourceLocator}/${file.path}`);
      expect(createHash("sha256").update(bytes).digest("hex"), file.path).toBe(file.sha256);
    }
    const afterInstall = (await events()).length;
    expect(await defaults.syncCompany(companyId)).toEqual([
      expect.objectContaining({ status: "preserved", skillId: installed.id }),
    ]);
    expect(await events()).toHaveLength(afterInstall);
    expect(await db.select().from(companySkills).where(eq(companySkills.companyId, otherCompanyId))).toEqual([]);

    const runtime = await skills.listRuntimeSkillEntries(companyId, {
      selectionConfig: selectedConfig, includeLegacy: false, snapshotLatest: true,
    });
    expect(runtime).toEqual([expect.objectContaining({ key: catalog.key, sourceStatus: "available", versionId: expect.any(String) })]);
    expect(runtime[0].source).not.toBe(installed.sourceLocator);
    expect(path.resolve(runtime[0].source).startsWith(`${path.resolve(home)}${path.sep}`)).toBe(true);
    for (const file of catalog.files) {
      const bytes = await fs.readFile(`${runtime[0].source}/${file.path}`);
      expect(createHash("sha256").update(bytes).digest("hex"), `runtime ${file.path}`).toBe(file.sha256);
    }
    const currentAgents = await db.select().from(agents);
    for (const original of [selected, unselected, other]) {
      expect(currentAgents.find(agent => agent.id === original.id)).toMatchObject({
        adapterConfig: original.adapterConfig, permissions: original.permissions, runtimeConfig: original.runtimeConfig,
      });
    }
    expect(network).not.toHaveBeenCalled();
  }, 90_000);
});
