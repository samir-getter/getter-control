import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { and, eq, sql } from "drizzle-orm";
import { activityLog, agents, companies, companySkillPolicies, companySkills, createDb, resourceLifecycleEvents, type Db } from "@paperclipai/db";
import type { CatalogSkill } from "@paperclipai/shared";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "./helpers/embedded-postgres.js";

const catalog = vi.hoisted(() => ({ listCatalogSkills: vi.fn(), getCatalogSkillOrThrow: vi.fn(),
  resolveCatalogSkillReference: vi.fn(), copyCatalogSkillFile: vi.fn(), getCatalogPackageMetadata: vi.fn() }));
vi.mock("../services/skills-catalog.js", () => catalog);

const markdown = "---\nname: catalog-fixture\ndescription: A fixture for automatic company catalog provisioning.\n---\n\n# Catalog fixture\n";
const reference = "# Reference\n";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const files = [
  { path: "SKILL.md", kind: "skill" as const, sizeBytes: Buffer.byteLength(markdown), sha256: hash(markdown) },
  { path: "references/guide.md", kind: "reference" as const, sizeBytes: Buffer.byteLength(reference), sha256: hash(reference) },
];
const skill: CatalogSkill = {
  id: "paperclipai:bundled:design:catalog-fixture", key: "paperclipai/bundled/design/catalog-fixture",
  kind: "bundled", category: "design", slug: "catalog-fixture", name: "Catalog fixture",
  description: "A fixture for automatic company catalog provisioning.", path: "catalog/bundled/design/catalog-fixture",
  entrypoint: "SKILL.md", trustLevel: "markdown_only", compatibility: "compatible", defaultInstall: true,
  recommendedForRoles: ["designer"], requires: [], tags: ["design"], files,
  contentHash: `sha256:${hash(JSON.stringify(files.map(file => ({ path: file.path, sha256: file.sha256 }))))}`,
};

const support = await getEmbeddedPostgresTestSupport();
const describeDatabase = support.supported ? describe : describe.skip;
describeDatabase("company catalog defaults", () => {
  let database: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>>;
  let db: Db;
  let home: string;
  let defaults: ReturnType<typeof import("../services/company-catalog-defaults.js").companyCatalogDefaultsService>;
  let companyModule: typeof import("../services/companies.js");
  let skillModule: typeof import("../services/company-skills.js");
  let accessModule: typeof import("../services/skill-access.js");
  let activityModule: typeof import("../services/activity-log.js");
  beforeAll(async () => {
    database = await startEmbeddedPostgresTestDatabase("getter-company-catalog-defaults-");
    db = createDb(database.connectionString);
    home = await fs.mkdtemp(path.join(os.tmpdir(), "getter-catalog-defaults-home-"));
    const { companyCatalogDefaultsService } = await import("../services/company-catalog-defaults.js");
    defaults = companyCatalogDefaultsService(db);
    // Cold dependency transforms belong to fixture initialization rather than
    // the first company-creation test's execution timeout.
    companyModule = await import("../services/companies.js");
    skillModule = await import("../services/company-skills.js");
    accessModule = await import("../services/skill-access.js");
    activityModule = await import("../services/activity-log.js");
  }, 120_000);
  afterAll(async () => {
    await database?.cleanup();
    if (home) await fs.rm(home, { recursive: true, force: true });
  });
  beforeEach(() => {
    vi.stubEnv("GETTER_CONTROL_HOME", home);
    vi.stubEnv("PAPERCLIP_HOME", home);
    vi.stubEnv("GETTER_CONTROL_DEFAULT_SKILLS", "1");
    catalog.listCatalogSkills.mockReturnValue([skill]);
    catalog.getCatalogSkillOrThrow.mockReturnValue(skill);
    catalog.resolveCatalogSkillReference.mockReturnValue({ skill, ambiguous: false });
    catalog.getCatalogPackageMetadata.mockReturnValue({ packageName: "@paperclipai/skills-catalog", packageVersion: "0.3.1" });
    catalog.copyCatalogSkillFile.mockImplementation(async (_id: string, file: string, target: string) => {
      await fs.writeFile(target, file === "SKILL.md" ? markdown : reference);
    });
  });
  afterEach(async () => {
    await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL client_min_messages = warning`);
      await tx.execute(sql`TRUNCATE TABLE companies CASCADE`);
    });
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  async function company(status = "active") {
    const id = randomUUID();
    await db.insert(companies).values({ id, name: "Defaults fixture", issuePrefix: `D${id.slice(0, 6)}`, status });
    return id;
  }
  const installed = (companyId: string) => db.select().from(companySkills).where(and(
    eq(companySkills.companyId, companyId), eq(companySkills.key, skill.key)));
  const activity = (companyId: string) => db.select().from(activityLog).where(and(
    eq(activityLog.companyId, companyId), eq(activityLog.action, "company.skill_catalog_installed")));

  it("bootstraps existing active/paused companies once and performs no copy or write on repeated/concurrent reconciliation", async () => {
    const first = await company(); const second = await company(); const paused = await company("paused"); const archived = await company("archived");
    expect((await defaults.syncAll()).map(result => result.status)).toEqual(["installed", "installed", "installed"]);
    expect(await installed(first)).toHaveLength(1); expect(await installed(second)).toHaveLength(1);
    expect(await installed(paused)).toHaveLength(1);
    expect(await installed(archived)).toEqual([]);
    const copies = catalog.copyCatalogSkillFile.mock.calls.length;
    const before = (await installed(first))[0]!;
    await Promise.all([defaults.syncCompany(first), defaults.syncCompany(first)]);
    expect(catalog.copyCatalogSkillFile).toHaveBeenCalledTimes(copies);
    expect(await installed(first)).toEqual([before]);
    expect(await activity(first)).toHaveLength(1);
  });

  it("preserves edited, pinned, or older company copies and conflicting slugs", async () => {
    const companyId = await company();
    const [{ skillId }] = await defaults.syncCompany(companyId);
    const [row] = await installed(companyId);
    await fs.writeFile(path.join(row!.sourceLocator!, "SKILL.md"), "User edited the file");
    await db.update(companySkills).set({ markdown: "Pinned user content", sourceRef: "older-origin",
      metadata: { ...row!.metadata, originHash: "older-origin", userModifiedAt: new Date().toISOString() } })
      .where(eq(companySkills.id, skillId!));
    const before = (await installed(companyId))[0];
    expect(await defaults.syncCompany(companyId)).toEqual([expect.objectContaining({ status: "preserved", skillId })]);
    expect(await installed(companyId)).toEqual([before]);
    expect(await fs.readFile(path.join(row!.sourceLocator!, "SKILL.md"), "utf8")).toBe("User edited the file");
    const other = await company();
    const [conflict] = await db.insert(companySkills).values({ companyId: other, key: `company/${other}/custom`,
      slug: skill.slug, name: "Private custom skill", markdown: "Private content" }).returning();
    expect(await defaults.syncCompany(other)).toEqual([expect.objectContaining({ status: "preserved", skillId: conflict!.id })]);
    expect(await installed(other)).toEqual([]);
  });

  it("serializes two first installs of the same company default", async () => {
    const companyId = await company();
    const results = await Promise.all([defaults.syncCompany(companyId), defaults.syncCompany(companyId)]);
    expect(results.flat().map(result => result.status).sort()).toEqual(["installed", "preserved"]);
    expect(await installed(companyId)).toHaveLength(1);
    expect(await activity(companyId)).toHaveLength(1);
    // The pinned origin and live company copy are each materialized once.
    expect(catalog.copyCatalogSkillFile).toHaveBeenCalledTimes(files.length * 2);
  });

  it.each(["manual-first", "default-first", "default-first-other-key"])("serializes %s installation before shared filesystem changes", async order => {
    const companyId = await company();
    const differentKey = order === "default-first-other-key";
    const otherSkill: CatalogSkill = { ...skill, id: "paperclipai:bundled:design:other-fixture",
      key: "paperclipai/bundled/design/other-fixture", slug: "other-fixture", path: "catalog/bundled/design/other-fixture" };
    if (differentKey) catalog.getCatalogSkillOrThrow.mockImplementation((id: string) => id === otherSkill.id ? otherSkill : skill);
    let entered!: () => void; let release!: () => void;
    const copyEntered = new Promise<void>(resolve => { entered = resolve; });
    const copyReleased = new Promise<void>(resolve => { release = resolve; });
    let firstCopy = true;
    catalog.copyCatalogSkillFile.mockImplementation(async (_id: string, file: string, target: string) => {
      if (firstCopy) { firstCopy = false; entered(); await copyReleased; }
      await fs.writeFile(target, file === "SKILL.md" ? markdown : reference);
    });
    const manual = () => skillModule.companySkillService(db).installFromCatalog(companyId, {
      catalogSkillId: differentKey ? otherSkill.id : skill.id,
    });
    const first = order === "manual-first" ? manual() : defaults.syncCompany(companyId);
    await copyEntered;
    const second = order === "manual-first" ? defaults.syncCompany(companyId) : manual();
    try {
      // Observe an actual ungranted PostgreSQL advisory lock, so a slow writer
      // proves the other operation waits before copying shared pinned paths.
      await vi.waitFor(async () => {
        const rows = await db.execute<{ waiting: number }>(sql`select count(*)::integer as waiting from pg_locks
          where locktype = 'advisory' and not granted`);
        expect(Number(rows[0]?.waiting)).toBeGreaterThan(0);
      }, { timeout: 10_000, interval: 20 });
      expect(catalog.copyCatalogSkillFile).toHaveBeenCalledTimes(1);
    } finally { release(); }
    await first;
    const [row] = await installed(companyId);
    if (order === "manual-first") {
      await fs.writeFile(path.join(row!.sourceLocator!, "SKILL.md"), `${markdown}\nUser edit after explicit installation\n`);
      expect(await second).toEqual([expect.objectContaining({ status: "preserved" })]);
      expect(await fs.readFile(path.join(row!.sourceLocator!, "SKILL.md"), "utf8")).toContain("User edit after explicit installation");
    } else {
      expect(await second).toMatchObject({ action: differentKey ? "created" : "unchanged" });
    }
    expect(await installed(companyId)).toHaveLength(1);
    expect(catalog.copyCatalogSkillFile).toHaveBeenCalledTimes(files.length * (differentKey ? 4 : 2));
  });

  it.each(["default", "targeted"])("honors conservative %s policy denials without copying or recording installation", async mode => {
    const companyId = await company();
    await db.insert(companySkillPolicies).values({ companyId, revision: 1, defaultEffect: mode === "default" ? "deny" : "allow",
      rules: mode === "default" ? [] : [{ id: "deny-design", priority: 0, effect: "deny", subject: { type: "all_agents" },
        actions: ["skills.install"], resources: { skillKeys: [skill.key], sourceTypes: ["catalog"] } }] });
    expect(await defaults.syncCompany(companyId)).toEqual([expect.objectContaining({ status: "policy_denied" })]);
    expect(await installed(companyId)).toEqual([]); expect(await activity(companyId)).toEqual([]);
    expect(catalog.copyCatalogSkillFile).not.toHaveBeenCalled();
  });

  it("rolls back a missing activity with the installed row and runtime events, then retries successfully", async () => {
    const companyId = await company();
    await db.insert(agents).values({ companyId, name: "Selected", adapterType: "paperclip_runner",
      adapterConfig: { paperclipSkillSync: { desiredSkills: [skill.key] } } });
    const events = () => db.select().from(resourceLifecycleEvents).where(and(
      eq(resourceLifecycleEvents.companyId, companyId), eq(resourceLifecycleEvents.resourceType, "agent_runtime")));
    const before = await events();
    const activityFailure = vi.spyOn(activityModule, "logActivity").mockRejectedValueOnce(new Error("activity persistence failed"));
    expect(await defaults.syncCompany(companyId)).toEqual([expect.objectContaining({ status: "failed", error: "activity persistence failed" })]);
    expect(await installed(companyId)).toEqual([]); expect(await activity(companyId)).toEqual([]);
    expect(await events()).toEqual(before);
    activityFailure.mockRestore();
    expect(await defaults.syncCompany(companyId)).toEqual([expect.objectContaining({ status: "installed" })]);
    expect(await installed(companyId)).toHaveLength(1); expect(await activity(companyId)).toHaveLength(1);
  });

  it("retries audit/copy failures without caching a successful install", async () => {
    const companyId = await company();
    catalog.copyCatalogSkillFile.mockRejectedValueOnce(new Error("source unavailable"));
    expect(await defaults.syncCompany(companyId)).toEqual([expect.objectContaining({ status: "failed", error: "source unavailable" })]);
    expect(await installed(companyId)).toEqual([]);
    expect(await defaults.syncCompany(companyId)).toEqual([expect.objectContaining({ status: "installed" })]);
  });

  it("creates defaults as system setup without inheriting or widening another company actor", async () => {
    const { companyService } = companyModule;
    const { companySkillService } = skillModule;
    const { currentSkillActor, withSkillActor } = accessModule;
    const other = await company();
    const actor = { type: "agent" as const, agentId: randomUUID(), companyId: other };
    await withSkillActor(actor, async () => {
      const created = await companyService(db).create({ name: "New Getter company", issuePrefix: "NGC" });
      expect(await installed(created.id)).toHaveLength(1);
      expect((await activity(created.id))[0]).toMatchObject({ actorType: "system", actorId: "getter-control-catalog" });
      expect(currentSkillActor()).toEqual(actor);
      expect(await companySkillService(db).list(created.id)).toEqual([]);
    });
  });

  it("keeps default setup absent when the Getter launcher feature is disabled", async () => {
    vi.stubEnv("GETTER_CONTROL_DEFAULT_SKILLS", "0");
    const { companyService } = companyModule;
    const created = await companyService(db).create({ name: "Source-only company", issuePrefix: "SOC" });
    expect(await installed(created.id)).toEqual([]); expect(catalog.copyCatalogSkillFile).not.toHaveBeenCalled();
  });

  it("does not install optional/nondefault entries or nonexistent companies and stops a startup batch", async () => {
    const companyId = await company();
    catalog.listCatalogSkills.mockReturnValue([{ ...skill, defaultInstall: false }, { ...skill, kind: "optional" }]);
    expect(await defaults.syncCompany(companyId)).toEqual([]);
    catalog.listCatalogSkills.mockReturnValue([skill]);
    expect(await defaults.syncAll({ shouldStop: () => true })).toEqual([]);
    expect(await defaults.syncCompany(randomUUID())).toEqual([expect.objectContaining({ status: "failed", error: "Company not found" })]);
    expect(catalog.copyCatalogSkillFile).not.toHaveBeenCalled();
  });
});
