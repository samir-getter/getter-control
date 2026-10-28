import { describe, expect, it } from "vitest";
import { SKILLS_NAVIGATION_HREFS } from "../pages/skills/skills-navigation";
import { CALM_ROUTE_HOMES, getCalmNavigation, getCalmPageLinks, resolveCalmArea, resolveCalmTab } from "./calm-navigation";

describe("CALM navigation registry", () => {
  it("provides seven areas and a stable primary destination from the same items", () => {
    const areas = getCalmNavigation();
    expect(areas.map((area) => area.id)).toEqual(["work", "agents", "routines", "knowledge", "connections", "audit", "settings"]);
    for (const area of areas) {
      expect(area.href).toBe(area.items[0]?.href);
      expect(new Set(area.items.map((item) => item.id)).size).toBe(area.items.length);
      expect(area.items.some((item) => !item.more)).toBe(true);
    }
    expect(areas[0]?.items.find((item) => item.id === "tasks")?.href).toBe("/issues");
    expect(areas.find((area) => area.id === "knowledge")?.href).toBe(SKILLS_NAVIGATION_HREFS.installed);
  });

  it.each([
    [false, false, "/inbox", "Inbox"],
    [false, true, "/inbox", "Inbox"],
    [true, false, "/inbox", "Inbox"],
    [true, true, "/issues?view=mine", "My work"],
  ])("preserves Inbox behavior with streamlined=%s and combined=%s", (enableStreamlinedUi, enableCombinedInboxTasks, href, label) => {
    const settings = { enableStreamlinedUi, enableCombinedInboxTasks };
    expect(getCalmNavigation(settings)[0]?.items.find((item) => item.id === "inbox")).toMatchObject({ href, label, more: true });
    expect(getCalmPageLinks(settings).find((item) => item.id === "inbox")).toMatchObject({ href, label });
  });

  it("honors optional discovery while retaining old Cmd K pages", () => {
    const hidden = getCalmNavigation().flatMap((area) => area.items).map((item) => item.id);
    for (const id of ["chat", "conference-room", "builtin-agents", "workspaces", "status", "goals", "decisions", "cases", "environments", "chat-connector", "design"]) expect(hidden).not.toContain(id);
    const settings = {
      enableAgentChat: true, enableConferenceRoomChat: true, enableBuiltInAgents: true,
      enableIsolatedWorkspaces: true, enableStatusCards: true, enableGoalsSidebarLink: true,
      enableDecisions: true, enableCases: true, enableEnvironments: true, enableChatConnectors: true,
      enablePaperclipDeveloperMode: true,
    };
    const visible = getCalmNavigation(settings).flatMap((area) => area.items).map((item) => item.id);
    for (const id of ["chat", "conference-room", "builtin-agents", "status", "goals", "decisions", "cases", "environments", "chat-connector", "design"]) expect(visible).toContain(id);
    expect(visible).not.toContain("workspaces");
    expect(getCalmNavigation({ ...settings, enableStreamlinedUi: false })[0]?.items.map((item) => item.id)).toContain("workspaces");
    expect(getCalmNavigation({ enableIsolatedWorkspaces: true })[0]?.items.map((item) => item.id)).toContain("workspaces");
    const pages = getCalmPageLinks();
    for (const href of ["/dashboard", "/inbox", "/issues", "/projects", "/goals", "/agents", "/costs", "/activity"]) expect(pages.map((page) => page.href)).toContain(href);
    expect(new Set(pages.map((page) => page.href)).size).toBe(pages.length);
    expect(pages.filter((page) => page.label === "Agents")).toHaveLength(1);
    expect(pages.filter((page) => page.label === "Costs")).toHaveLength(1);
  });

  it("keeps Skills navigation helpers and unconditional Artifacts discovery", () => {
    for (const enableArtifactsV1 of [false, true]) {
      const knowledge = getCalmNavigation({ enableArtifactsV1 }).find((area) => area.id === "knowledge")!;
      for (const href of Object.values(SKILLS_NAVIGATION_HREFS)) expect(knowledge.items.map((item) => item.href)).toContain(href);
      expect(knowledge.items.map((item) => item.href)).toContain("/artifacts");
    }
  });

  it.each([
    ["/ACME/dashboard", "work"], ["/ACME/issues/ISS-1?view=mine", "work"],
    ["/ACME/projects/project-a/workspaces/workspace-a", "work"], ["/execution-workspaces/a/services", "work"],
    ["/ACME/status-cards/a", "work"], ["/ACME/agents/all", "agents"], ["/agents/alice/runs/run-a", "agents"],
    ["/ACME/chats/alice", "agents"], ["/ACME/board-chat", "agents"],
    ["/ACME/routines/daily/triggers", "routines"], ["/ACME/skills/source-a/studio", "knowledge"],
    ["/skills", "knowledge"], ["/skills/studio/new", "knowledge"], ["/ACME/skills/sources/a", "knowledge"],
    ["/ACME/apps/chat/connect", "connections"], ["/ACME/apps/advanced/profiles/new", "connections"],
    ["/ACME/company/settings/tools/a", "connections"], ["/ACME/apps/gateways/a/settings", "connections"],
    ["/ACME/activity/timeline", "audit"], ["/audit/costs", "audit"], ["/ACME/costs", "audit"],
    ["/ACME/company/settings/instance/plugins/a", "settings"], ["/ACME/company/export", "settings"],
    ["/ACME/custom-plugin/page", "settings"], ["/ACME/company/settings/custom-plugin/page", "settings"],
    ["/settings/profile", "settings"], ["/ACME/onboarding", null], ["/onboarding", null],
    ["/auth", null], ["/invite/token-a", null], ["/", null], ["/ACME", null], ["/OTHER/dashboard", null],
  ])("resolves %s to its registered home", (path, expected) => {
    expect(resolveCalmArea(path, "ACME")).toBe(expected);
  });

  it("follows router case-insensitivity and treats the tenant prefix literally", () => {
    expect(resolveCalmArea("/acme/AGENTS/All/", "Acme")).toBe("agents");
    expect(resolveCalmArea("/ACME.+/dashboard", "ACME.+")).toBe("work");
    expect(resolveCalmArea("/ACME-any/dashboard", "ACME.+")).toBeNull();
  });

  it("assigns each audited pattern one explicit home", () => {
    expect(CALM_ROUTE_HOMES).toHaveLength(234);
    expect(new Set(CALM_ROUTE_HOMES.map((home) => home.pattern)).size).toBe(234);
    expect(CALM_ROUTE_HOMES.find((home) => home.pattern === "/:companyPrefix/:pluginRoutePath/*")).toMatchObject({ kind: "area", areaId: "settings" });
  });

  it("keeps every visible page link within its registered area", () => {
    for (const settings of [{}, { enableStreamlinedUi: false }, { enableIsolatedWorkspaces: true }, {
      enableAgentChat: true, enableConferenceRoomChat: true, enableBuiltInAgents: true,
      enableStatusCards: true, enableGoalsSidebarLink: true, enableDecisions: true,
      enableCases: true, enableEnvironments: true, enableChatConnectors: true,
      enablePaperclipDeveloperMode: true,
    }]) {
      for (const page of getCalmPageLinks(settings)) {
        expect(resolveCalmArea(`/ACME${page.href}`, "ACME"), page.href).toBe(page.areaId);
      }
    }
  });

  it.each([
    ["company.members", "people"], ["instance.profile", "preferences"],
    ["company.export", "export"], ["company.import", "import"], ["company.secrets", "secrets"],
    ["instance.environments", "environments"], ["instance.access", "access"],
    ["instance.experimental", "experimental"], ["instance.adapters", "adapters"], ["instance.plugins", "plugins"],
  ] as const)("honors operator-hidden %s in navigation and Cmd K", (hiddenSetting, id) => {
    const hiddenSettings = new Set<string>([hiddenSetting]);
    const policy = { hiddenSettings };
    const settings = { enableEnvironments: true };
    expect(getCalmNavigation(settings).flatMap((area) => area.items).map((item) => item.id)).toContain(id);
    expect(getCalmPageLinks(settings).map((item) => item.id)).toContain(id);
    expect(getCalmNavigation(settings, policy).flatMap((area) => area.items).map((item) => item.id)).not.toContain(id);
    expect(getCalmPageLinks(settings, policy).map((item) => item.id)).not.toContain(id);
    expect([...hiddenSettings]).toEqual([hiddenSetting]);
  });

  it("hides Import on managed Cloud while keeping Export and self-hosted Import", () => {
    for (const isCloud of [false, true]) {
      const policy = { isCloud };
      const items = getCalmNavigation({}, policy).flatMap((area) => area.items);
      const pages = getCalmPageLinks({}, policy);
      expect(items.some((item) => item.id === "import")).toBe(!isCloud);
      expect(pages.some((item) => item.id === "import")).toBe(!isCloud);
      expect(items.some((item) => item.id === "export")).toBe(true);
      expect(pages.some((item) => item.id === "export")).toBe(true);
    }
  });

  it("preserves all old Cmd K pages and route homes under the strict hosting policy", () => {
    const policy = { isCloud: true, hiddenSettings: new Set([
      "company.members", "instance.profile", "company.export", "company.import", "company.secrets",
      "instance.environments", "instance.access", "instance.experimental", "instance.adapters", "instance.plugins",
    ]) };
    const pages = getCalmPageLinks({ enableEnvironments: true }, policy);
    for (const href of ["/dashboard", "/inbox", "/issues", "/projects", "/goals", "/agents", "/costs", "/activity"]) expect(pages.map((page) => page.href)).toContain(href);
    const settings = getCalmNavigation({ enableEnvironments: true }, policy).find((area) => area.id === "settings")!;
    expect(settings.href).toBe("/company/settings");
    expect(settings.items.map((item) => item.id)).toEqual(["company", "companies"]);
    expect(CALM_ROUTE_HOMES).toHaveLength(234);
    expect(resolveCalmArea("/ACME/company/import", "ACME")).toBe("settings");
    expect(resolveCalmArea("/ACME/company/settings/instance/plugins/a", "ACME")).toBe("settings");
  });

  it("uses the existing exact page-key policy without hiding a whole page for a subsection key", () => {
    const policy = { hiddenSettings: new Set(["company.secrets.vaults", "instance.experimental.enableEnvironments", "unknown.page"]) };
    const pages = getCalmPageLinks({ enableEnvironments: true }, policy);
    for (const id of ["secrets", "environments", "experimental"]) expect(pages.map((page) => page.id)).toContain(id);
  });
});

describe("CALM primary tab membership", () => {
  it.each([
    ["/ACME/agents/agent-a/configuration", "agents"],
    ["/agents/agent-a/configuration", "agents"],
    ["/ACME/agents/all", "agents"],
    ["/ACME/approvals/all", "approvals"],
    ["/ACME/approvals/approval-a", "approvals"],
    ["/approvals/all", "approvals"],
    ["/approvals/approval-a", "approvals"],
    ["/ACME/apps", "connectors"],
    ["/ACME/apps/review", "reviews"],
    ["/apps/review", "reviews"],
    ["/ACME/apps/connection-a/permissions", "connectors"],
    ["/ACME/company/settings/tools/profiles", "connectors"],
    ["/ACME/activity/runs", "runs"],
    ["/ACME/audit/runs", "runs"],
    ["/ACME/audit/costs", "costs"],
    ["/ACME/audit/budgets", "budgets"],
    ["/ACME/issues/ISS-1?view=mine", "tasks"],
    ["/ACME/tasks", "tasks"],
    ["/ACME/company/settings/members", "people"],
    ["/ACME/company/settings/instance/profile", "preferences"],
  ])("selects the most specific visible primary tab for %s", (pathname, expected) => {
    expect(resolveCalmTab(pathname, "ACME")).toBe(expected);
  });

  it("handles tenant case and literal prefixes without accepting a different company", () => {
    expect(resolveCalmTab("/acme/AGENTS/Agent-A/CONFIGURATION/", "Acme")).toBe("agents");
    expect(resolveCalmTab("/TENANT.+/approvals/approval-a", "TENANT.+")).toBe("approvals");
    expect(resolveCalmTab("/TENANT-other/approvals/all", "TENANT.+")).toBeNull();
    expect(resolveCalmTab("/OTHER/agents/agent-a/configuration", "ACME")).toBeNull();
    expect(resolveCalmTab("/OTHER/approvals/all", "ACME")).toBeNull();
    expect(resolveCalmTab("/ACME/agents/agent-a/configuration")).toBe("agents");
  });

  it("selects only visible primary tabs and honors hosting policy", () => {
    expect(resolveCalmTab("/ACME/chats/agent-a", "ACME")).toBeNull();
    expect(resolveCalmTab("/ACME/chats/agent-a", "ACME", { enableAgentChat: true })).toBe("chat");
    const policy = { hiddenSettings: new Set(["company.members", "instance.profile"]), isCloud: true };
    expect(resolveCalmTab("/ACME/company/settings/members", "ACME", {}, policy)).not.toBe("people");
    expect(resolveCalmTab("/ACME/company/settings/instance/profile", "ACME", {}, policy)).not.toBe("preferences");
    expect(resolveCalmTab("/ACME/company/import", "ACME", {}, policy)).toBeNull();
    expect(resolveCalmTab("/ACME/workspaces", "ACME", { enableIsolatedWorkspaces: true })).toBeNull();
  });

  it("returns no primary tab for system, onboarding or unknown destinations", () => {
    for (const pathname of ["/auth", "/onboarding", "/ACME/onboarding", "/ACME", "/ACME/future-page"]) {
      expect(resolveCalmTab(pathname, "ACME"), pathname).toBeNull();
    }
    expect(CALM_ROUTE_HOMES).toHaveLength(234);
  });

  it("selects every primary link from its own registry definition", () => {
    const settings = { enableAgentChat: true };
    for (const area of getCalmNavigation(settings)) {
      for (const item of area.items.filter((item) => !item.more)) {
        expect(resolveCalmTab(`/ACME${item.href}`, "ACME", settings), item.href).toBe(item.id);
      }
    }
  });
});
