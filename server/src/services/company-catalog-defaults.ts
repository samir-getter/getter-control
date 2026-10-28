import { and, eq, inArray, or } from "drizzle-orm";
import { companies, companySkills, type Db } from "@paperclipai/db";
import { normalizeSkillPolicySourceLocator, type CatalogSkill, type SkillPolicyRule } from "@paperclipai/shared";
import { notFound } from "../errors.js";
import { logger } from "../middleware/logger.js";
import { logActivity, publishActivity, type ActivityPublication } from "./activity-log.js";
import { companySkillPolicyService } from "./company-skill-policy.js";
import { companySkillService, lockCompanyCatalogSkillInstall } from "./company-skills.js";
import { withoutSkillActor } from "./skill-access.js";
import { listCatalogSkills } from "./skills-catalog.js";

export interface CompanyCatalogDefaultResult {
  companyId: string;
  catalogSkillId: string;
  key: string;
  status: "installed" | "preserved" | "policy_denied" | "failed";
  skillId?: string;
  error?: string;
}

function appliesToDefault(rule: SkillPolicyRule, skill: CatalogSkill) {
  if (rule.effect !== "deny" || !rule.actions.includes("skills.install")) return false;
  const resource = rule.resources;
  if (!resource) return true;
  // First installation has no company skill ID. Only selectors naming this
  // catalog entry can apply to automatic provisioning.
  if (resource.skillIds && !resource.skillIds.includes(skill.id)) return false;
  if (resource.skillKeys && !resource.skillKeys.includes(skill.key)) return false;
  if (resource.sourceTypes && !resource.sourceTypes.includes("catalog")) return false;
  if (resource.sourceLocators && !resource.sourceLocators.some(locator =>
    normalizeSkillPolicySourceLocator(locator) === normalizeSkillPolicySourceLocator(skill.id))) return false;
  return true;
}

/** One-shot bootstrap of public app defaults. Existing company copies and agent
 * assignments remain owned by their explicit install/update/sync operations. */
export function companyCatalogDefaultsService(db: Db) {
  async function syncCompany(companyId: string, options: { shouldStop?: () => boolean } = {}) {
    const results: CompanyCatalogDefaultResult[] = [];
    const defaults = listCatalogSkills().filter(skill => skill.defaultInstall && skill.kind === "bundled");
    for (const skill of defaults) {
      if (options.shouldStop?.()) break;
      const result = await withoutSkillActor(async (): Promise<CompanyCatalogDefaultResult> => {
        const publications: ActivityPublication[] = [];
        try {
          const completed = await db.transaction(async tx => {
            const transactionDb = tx as unknown as Db;
            // Serialize startup, company creation and explicit repeated bootstrap
            // calls without a process-global cache that could mask failed work.
            await lockCompanyCatalogSkillInstall(tx, companyId);
            const company = await tx.select({ id: companies.id }).from(companies).where(eq(companies.id, companyId))
              .then(rows => rows[0]);
            if (!company) throw notFound("Company not found");
            const existing = await tx.select({ id: companySkills.id }).from(companySkills).where(and(
              eq(companySkills.companyId, companyId), or(eq(companySkills.key, skill.key), eq(companySkills.slug, skill.slug)),
            )).then(rows => rows[0]);
            if (existing) return { companyId, catalogSkillId: skill.id, key: skill.key,
              status: "preserved", skillId: existing.id } satisfies CompanyCatalogDefaultResult;

            const policy = await companySkillPolicyService(transactionDb).get(companyId);
            // Automatic system setup has no agent principal. Conservatively
            // retain every applicable deny, including role/agent-specific rules;
            // an administrator can still perform an explicitly authorized install.
            if (policy.defaultEffect === "deny" || policy.rules.some(rule => appliesToDefault(rule, skill))) {
              return { companyId, catalogSkillId: skill.id, key: skill.key,
                status: "policy_denied" } satisfies CompanyCatalogDefaultResult;
            }
            const installed = await companySkillService(transactionDb).installFromCatalog(companyId, { catalogSkillId: skill.id });
            await logActivity(transactionDb, {
              companyId, actorType: "system", actorId: "getter-control-catalog",
              action: "company.skill_catalog_installed", entityType: "company_skill", entityId: installed.skill.id,
              details: { catalogSkillId: skill.id, catalogKey: skill.key, slug: installed.skill.slug,
                originHash: skill.contentHash, warningCount: installed.warnings.length, automaticDefault: true },
            }, publications);
            return { companyId, catalogSkillId: skill.id, key: skill.key,
              status: "installed", skillId: installed.skill.id } satisfies CompanyCatalogDefaultResult;
          });
          // Never publish a successful install before its activity and skill row
          // commit together. Existing SQL triggers deliver selected-agent updates.
          for (const publication of publications) {
            try { publishActivity(publication); }
            catch (error) { logger.warn({ err: error, companyId, key: skill.key }, "default catalog activity publication failed after commit"); }
          }
          return completed;
        } catch (error) {
          // A failed transaction leaves no installed row or runtime event. Do
          // not delete shared catalog paths: an explicit installer may own them.
          // A retry safely replaces any unreferenced pinned files.
          return { companyId, catalogSkillId: skill.id, key: skill.key, status: "failed",
            error: error instanceof Error ? error.message : String(error) };
        }
      });
      if (result.status === "failed" || result.status === "policy_denied") {
        logger.warn({ ...result }, "company catalog default not installed; retry on next startup or explicit install");
      }
      results.push(result);
    }
    return results;
  }

  async function syncAll(options: { shouldStop?: () => boolean } = {}) {
    const companyIds = await db.select({ id: companies.id }).from(companies).where(inArray(companies.status, ["active", "paused"]));
    const results: CompanyCatalogDefaultResult[] = [];
    for (const company of companyIds) {
      if (options.shouldStop?.()) break;
      results.push(...await syncCompany(company.id, options));
    }
    return results;
  }

  return { syncCompany, syncAll };
}
