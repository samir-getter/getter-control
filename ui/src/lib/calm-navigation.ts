import type { HideableCompanyPage, HideableInstancePage, InstanceExperimentalSettings } from "@paperclipai/shared";
import { SKILLS_NAVIGATION_HREFS } from "../pages/skills/skills-navigation";

export type CalmAreaId = "work" | "agents" | "routines" | "knowledge" | "connections" | "audit" | "settings";
type Settings = Partial<InstanceExperimentalSettings>;

export interface CalmNavigationPolicy {
  hiddenSettings?: ReadonlySet<string>;
  isCloud?: boolean;
}

export interface CalmNavigationItem {
  id: string;
  label: string;
  href: string;
  more?: boolean;
}

export interface CalmNavigationArea {
  id: CalmAreaId;
  label: string;
  href: string;
  items: CalmNavigationItem[];
}

export interface CalmPageLink extends CalmNavigationItem {
  areaId: CalmAreaId;
}

interface ItemDefinition {
  id: string;
  label: string | ((settings: Settings) => string);
  href: string | ((settings: Settings) => string);
  more?: boolean;
  visible?: (settings: Settings) => boolean;
  hiddenSetting?: HideableCompanyPage | HideableInstancePage;
  hideOnCloud?: boolean;
  activePaths?: readonly string[];
  commandAlways?: boolean;
  commandLabel?: string;
  commandHref?: string;
}

interface AreaDefinition {
  id: CalmAreaId;
  label: string;
  items: readonly ItemDefinition[];
}

const streamlined = (settings: Settings) => settings.enableStreamlinedUi !== false;
const combinedInbox = (settings: Settings) => streamlined(settings) && settings.enableCombinedInboxTasks === true;
const chatRail = (settings: Settings) => streamlined(settings) && settings.enableAgentChat === true;
const workspacesVisible = (settings: Settings) => settings.enableIsolatedWorkspaces === true && !chatRail(settings);
const developerVisible = (settings: Settings) => settings.enablePaperclipDeveloperMode === true;

export const CALM_AREAS: readonly AreaDefinition[] = [
  {
    id: "work", label: "Work", items: [
      { id: "overview", label: "Overview", commandLabel: "Dashboard", href: "/dashboard" },
      { id: "tasks", label: "Tasks", href: "/issues", activePaths: ["/tasks/*"] },
      { id: "projects", label: "Projects", href: "/projects" },
      { id: "approvals", label: "Approvals", href: "/approvals/pending", activePaths: ["/approvals/*"] },
      { id: "inbox", label: (s) => combinedInbox(s) ? "My work" : "Inbox", href: (s) => combinedInbox(s) ? "/issues?view=mine" : "/inbox", more: true },
      { id: "decisions", label: "Decisions", href: "/decisions", more: true, visible: (s) => s.enableDecisions === true },
      { id: "cases", label: "Cases", href: "/cases", more: true, visible: (s) => s.enableCases === true },
      { id: "status", label: "Status", href: "/status", more: true, visible: (s) => s.enableStatusCards === true },
      { id: "goals", label: "Goals", href: "/goals", more: true, visible: (s) => s.enableGoalsSidebarLink === true, commandAlways: true },
      { id: "workspaces", label: "Workspaces", href: "/workspaces", more: true, visible: workspacesVisible },
      { id: "live-dashboard", label: "Live dashboard", href: "/dashboard/live", more: true },
      { id: "search", label: "Search", href: "/search", more: true },
      { id: "membership-requests", label: "Membership requests", href: "/inbox/requests", more: true },
    ],
  },
  {
    id: "agents", label: "Agents", items: [
      { id: "agents", label: "Agents", href: "/agents/all", commandHref: "/agents", activePaths: ["/agents/*"] },
      { id: "chat", label: "Chat", href: "/chats", visible: (s) => s.enableAgentChat === true },
      { id: "organization", label: "Organization chart", href: "/org", more: true },
      { id: "conference-room", label: "Conference Room", href: "/board-chat", more: true, visible: (s) => s.enableConferenceRoomChat === true },
      { id: "builtin-agents", label: "Built-in agents", href: "/agents/builtin", more: true, visible: (s) => s.enableBuiltInAgents === true },
    ],
  },
  {
    id: "routines", label: "Routines", items: [
      { id: "routines", label: "Routines", href: "/routines" },
    ],
  },
  {
    id: "knowledge", label: "Knowledge", items: [
      { id: "skills", label: "Skills", href: SKILLS_NAVIGATION_HREFS.installed },
      { id: "artifacts", label: "Artifacts", href: "/artifacts" },
      { id: "discover-skills", label: "Discover skills", href: SKILLS_NAVIGATION_HREFS.discover, more: true },
      { id: "authored-skills", label: "Authored skills", href: SKILLS_NAVIGATION_HREFS.authored, more: true },
      { id: "skill-sources", label: "Skill sources", href: SKILLS_NAVIGATION_HREFS.sources, more: true },
      { id: "new-skill", label: "Create skill", href: "/skills/studio/new", more: true },
    ],
  },
  {
    id: "connections", label: "Connections", items: [
      { id: "connectors", label: "Connectors", href: "/apps", activePaths: ["/tools/*", "/company/settings/tools/*"] },
      { id: "reviews", label: "Reviews", href: "/apps/review" },
      { id: "assistant", label: "Assistant connections", href: "/apps/assistant-connection", more: true },
      { id: "connect", label: "Connect an app", href: "/apps/connect", more: true },
      { id: "byo", label: "Bring your own app", href: "/apps/byo", more: true },
      { id: "gateways", label: "Gateways", href: "/apps/gateways", more: true },
      { id: "advanced", label: "Advanced tools", href: "/apps/advanced", more: true },
      { id: "chat-connector", label: "Connect chat", href: "/apps/chat/connect", more: true, visible: (s) => s.enableChatConnectors === true },
    ],
  },
  {
    id: "audit", label: "Audit", items: [
      { id: "activity", label: "Activity", href: "/activity", activePaths: ["/audit/*"] },
      { id: "runs", label: "Runs", href: "/activity/runs", activePaths: ["/runs/*", "/audit/runs/*"] },
      { id: "costs", label: "Costs", href: (s) => streamlined(s) ? "/activity/costs" : "/costs", commandHref: "/costs", activePaths: ["/activity/costs/*", "/costs/*", "/audit/costs/*"] },
      { id: "budgets", label: "Budgets", href: "/activity/budgets", activePaths: ["/budgets/*", "/audit/budgets/*"] },
      { id: "commentary", label: "Commentary", href: "/activity/commentary", more: true },
      { id: "timeline", label: "Timeline", href: (s) => streamlined(s) ? "/activity/timeline" : "/timeline", more: true },
    ],
  },
  {
    id: "settings", label: "Settings", items: [
      { id: "company", label: "Company", href: "/company/settings" },
      { id: "people", label: "People", href: "/company/settings/members", hiddenSetting: "company.members" },
      { id: "preferences", label: "Preferences", href: "/company/settings/instance/profile", hiddenSetting: "instance.profile" },
      { id: "companies", label: "Companies", href: "/companies", more: true },
      { id: "export", label: "Export", href: "/company/export", more: true, hiddenSetting: "company.export" },
      { id: "import", label: "Import", href: "/company/import", more: true, hiddenSetting: "company.import", hideOnCloud: true },
      { id: "secrets", label: "Secrets", href: "/company/settings/secrets", more: true, hiddenSetting: "company.secrets" },
      { id: "environments", label: "Environments", href: "/company/settings/instance/environments", more: true, visible: (s) => s.enableEnvironments === true, hiddenSetting: "instance.environments" },
      { id: "access", label: "Instance access", href: "/company/settings/instance/access", more: true, hiddenSetting: "instance.access" },
      { id: "experimental", label: "Experimental features", href: "/company/settings/instance/experimental", more: true, hiddenSetting: "instance.experimental" },
      { id: "adapters", label: "Adapters", href: "/company/settings/instance/adapters", more: true, hiddenSetting: "instance.adapters" },
      { id: "plugins", label: "Plugins", href: "/company/settings/instance/plugins", more: true, hiddenSetting: "instance.plugins" },
      { id: "design", label: "Design guide", href: "/design-guide", more: true, visible: developerVisible },
      { id: "task-chat-lab", label: "Task chat lab", href: "/dev/task-chat-lab", more: true, visible: (s) => import.meta.env.DEV && developerVisible(s) },
      { id: "long-thread-lab", label: "Long thread lab", href: "/tests/perf/long-thread", more: true, visible: (s) => import.meta.env.DEV && developerVisible(s) },
    ],
  },
];

function materializeItem(item: ItemDefinition, settings: Settings): CalmNavigationItem {
  return {
    id: item.id,
    label: typeof item.label === "function" ? item.label(settings) : item.label,
    href: typeof item.href === "function" ? item.href(settings) : item.href,
    ...(item.more ? { more: true } : {}),
  };
}

function allowedByPolicy(item: ItemDefinition, policy: CalmNavigationPolicy): boolean {
  return (!item.hiddenSetting || !policy.hiddenSettings?.has(item.hiddenSetting)) && !(item.hideOnCloud && policy.isCloud);
}

export function getCalmNavigation(settings: Settings = {}, policy: CalmNavigationPolicy = {}): CalmNavigationArea[] {
  return CALM_AREAS.map((area) => {
    const items = area.items.filter((item) => allowedByPolicy(item, policy) && (!item.visible || item.visible(settings))).map((item) => materializeItem(item, settings));
    return { id: area.id, label: area.label, href: items[0]!.href, items };
  });
}

export function getCalmPageLinks(settings: Settings = {}, policy: CalmNavigationPolicy = {}): CalmPageLink[] {
  const links: CalmPageLink[] = [];
  const seen = new Set<string>();
  for (const area of CALM_AREAS) {
    for (const definition of area.items) {
      if (!allowedByPolicy(definition, policy)) continue;
      if (definition.visible && !definition.visible(settings) && !definition.commandAlways) continue;
      const item = materializeItem(definition, settings);
      const candidate = { ...item, label: definition.commandLabel ?? item.label, href: definition.commandHref ?? item.href };
      if (seen.has(candidate.href)) continue;
      seen.add(candidate.href);
      links.push({ ...candidate, areaId: area.id });
    }
  }
  return links;
}

export type CalmRouteHome =
  | { pattern: string; kind: "area"; areaId: CalmAreaId }
  | { pattern: string; kind: "system" | "onboarding" | "container" | "fallback" };

export const CALM_ROUTE_GROUPS = {
  work: [
    "/:companyPrefix/approvals",
    "/:companyPrefix/approvals/:approvalId",
    "/:companyPrefix/approvals/all",
    "/:companyPrefix/approvals/pending",
    "/:companyPrefix/cases",
    "/:companyPrefix/cases/:caseIdentifier",
    "/:companyPrefix/dashboard",
    "/:companyPrefix/dashboard/live",
    "/:companyPrefix/decisions",
    "/:companyPrefix/decisions/queues/:key",
    "/:companyPrefix/execution-workspaces/:workspaceId",
    "/:companyPrefix/execution-workspaces/:workspaceId/configuration",
    "/:companyPrefix/execution-workspaces/:workspaceId/issues",
    "/:companyPrefix/execution-workspaces/:workspaceId/routines",
    "/:companyPrefix/execution-workspaces/:workspaceId/runtime-logs",
    "/:companyPrefix/execution-workspaces/:workspaceId/services",
    "/:companyPrefix/goals",
    "/:companyPrefix/goals/:goalId",
    "/:companyPrefix/inbox",
    "/:companyPrefix/inbox/all",
    "/:companyPrefix/inbox/blocked",
    "/:companyPrefix/inbox/mine",
    "/:companyPrefix/inbox/new",
    "/:companyPrefix/inbox/recent",
    "/:companyPrefix/inbox/requests",
    "/:companyPrefix/inbox/unread",
    "/:companyPrefix/issues",
    "/:companyPrefix/issues/:issueId",
    "/:companyPrefix/issues/active",
    "/:companyPrefix/issues/all",
    "/:companyPrefix/issues/backlog",
    "/:companyPrefix/issues/done",
    "/:companyPrefix/issues/recent",
    "/:companyPrefix/projects",
    "/:companyPrefix/projects/:projectId",
    "/:companyPrefix/projects/:projectId/budget",
    "/:companyPrefix/projects/:projectId/configuration",
    "/:companyPrefix/projects/:projectId/issues",
    "/:companyPrefix/projects/:projectId/issues/:filter",
    "/:companyPrefix/projects/:projectId/overview",
    "/:companyPrefix/projects/:projectId/workspaces",
    "/:companyPrefix/projects/:projectId/workspaces/:workspaceId",
    "/:companyPrefix/search",
    "/:companyPrefix/status",
    "/:companyPrefix/status-cards",
    "/:companyPrefix/status-cards/:cardId",
    "/:companyPrefix/status/:cardId",
    "/:companyPrefix/tasks",
    "/:companyPrefix/workspaces",
    "/cases",
    "/cases/:caseIdentifier",
    "/decisions",
    "/execution-workspaces/:workspaceId",
    "/execution-workspaces/:workspaceId/configuration",
    "/execution-workspaces/:workspaceId/issues",
    "/execution-workspaces/:workspaceId/routines",
    "/execution-workspaces/:workspaceId/runtime-logs",
    "/execution-workspaces/:workspaceId/services",
    "/issues",
    "/issues/:issueId",
    "/projects",
    "/projects/:projectId",
    "/projects/:projectId/configuration",
    "/projects/:projectId/issues",
    "/projects/:projectId/issues/:filter",
    "/projects/:projectId/overview",
    "/projects/:projectId/workspaces",
    "/projects/:projectId/workspaces/:workspaceId",
    "/status",
    "/status-cards",
    "/status-cards/:cardId",
    "/status/:cardId",
    "/tasks",
    "/workspaces",
  ],
  agents: [
    "/:companyPrefix/agents",
    "/:companyPrefix/agents/:agentId",
    "/:companyPrefix/agents/:agentId/:tab",
    "/:companyPrefix/agents/:agentId/runs/:runId",
    "/:companyPrefix/agents/active",
    "/:companyPrefix/agents/all",
    "/:companyPrefix/agents/builtin",
    "/:companyPrefix/agents/error",
    "/:companyPrefix/agents/new",
    "/:companyPrefix/agents/paused",
    "/:companyPrefix/board-chat",
    "/:companyPrefix/chats",
    "/:companyPrefix/chats/:agentRef",
    "/:companyPrefix/org",
    "/agents",
    "/agents/:agentId",
    "/agents/:agentId/:tab",
    "/agents/:agentId/runs/:runId",
    "/agents/active",
    "/agents/all",
    "/agents/builtin",
    "/agents/error",
    "/agents/new",
    "/agents/paused",
  ],
  routines: [
    "/:companyPrefix/routines",
    "/:companyPrefix/routines/:routineId",
    "/:companyPrefix/routines/:routineId/:section",
    "/routines",
    "/routines/:routineId",
  ],
  knowledge: [
    "/:companyPrefix/artifacts",
    "/:companyPrefix/skills/*",
    "/:companyPrefix/skills/:skillId/studio",
    "/:companyPrefix/skills/sources",
    "/:companyPrefix/skills/sources/:sourceId",
    "/:companyPrefix/skills/studio",
    "/:companyPrefix/skills/studio/:skillId",
    "/:companyPrefix/skills/studio/new",
    "/artifacts",
    "/skills/*",
    "/skills/:skillId/studio",
    "/skills/studio",
    "/skills/studio/:skillId",
    "/skills/studio/new",
  ],
  connections: [
    "/:companyPrefix/apps",
    "/:companyPrefix/apps/:connectionId",
    "/:companyPrefix/apps/:connectionId/:tab",
    "/:companyPrefix/apps/advanced",
    "/:companyPrefix/apps/advanced/:tab",
    "/:companyPrefix/apps/advanced/audit",
    "/:companyPrefix/apps/advanced/gateways",
    "/:companyPrefix/apps/advanced/profiles/:profileId",
    "/:companyPrefix/apps/advanced/profiles/:profileId/edit",
    "/:companyPrefix/apps/advanced/profiles/new",
    "/:companyPrefix/apps/advanced/run-your-own",
    "/:companyPrefix/apps/app/:applicationId",
    "/:companyPrefix/apps/app/:applicationId/:tab",
    "/:companyPrefix/apps/assistant-connection",
    "/:companyPrefix/apps/attention",
    "/:companyPrefix/apps/browse",
    "/:companyPrefix/apps/byo",
    "/:companyPrefix/apps/chat/:endpointId",
    "/:companyPrefix/apps/chat/:endpointId/:tab",
    "/:companyPrefix/apps/chat/:endpointId/reviews/:reviewId",
    "/:companyPrefix/apps/chat/connect",
    "/:companyPrefix/apps/connect",
    "/:companyPrefix/apps/connect/:appKey",
    "/:companyPrefix/apps/connect/:appKey/:stage",
    "/:companyPrefix/apps/connections",
    "/:companyPrefix/apps/gateways",
    "/:companyPrefix/apps/gateways/:gatewayId",
    "/:companyPrefix/apps/gateways/:gatewayId/:tab",
    "/:companyPrefix/apps/review",
    "/:companyPrefix/apps/vercel-connect",
    "/:companyPrefix/company/settings/tools",
    "/:companyPrefix/company/settings/tools/:tab",
    "/:companyPrefix/tools",
    "/:companyPrefix/tools/:tab",
  ],
  audit: [
    "/:companyPrefix/activity",
    "/:companyPrefix/activity/budgets",
    "/:companyPrefix/activity/commentary",
    "/:companyPrefix/activity/costs",
    "/:companyPrefix/activity/runs",
    "/:companyPrefix/activity/timeline",
    "/:companyPrefix/audit",
    "/:companyPrefix/audit/activity",
    "/:companyPrefix/audit/budgets",
    "/:companyPrefix/audit/costs",
    "/:companyPrefix/audit/runs",
    "/:companyPrefix/audit/timeline",
    "/:companyPrefix/budgets",
    "/:companyPrefix/costs",
    "/:companyPrefix/runs",
    "/:companyPrefix/timeline",
    "/activity",
    "/activity/*",
    "/audit",
    "/audit/*",
    "/budgets",
    "/costs",
    "/runs",
  ],
  settings: [
    "/:companyPrefix/:pluginRoutePath/*",
    "/:companyPrefix/companies",
    "/:companyPrefix/company/export/*",
    "/:companyPrefix/company/import",
    "/:companyPrefix/company/settings",
    "/:companyPrefix/company/settings/:settingsRoutePath/*",
    "/:companyPrefix/company/settings/access",
    "/:companyPrefix/company/settings/cloud-upstream",
    "/:companyPrefix/company/settings/connections",
    "/:companyPrefix/company/settings/environments",
    "/:companyPrefix/company/settings/instance",
    "/:companyPrefix/company/settings/instance/access",
    "/:companyPrefix/company/settings/instance/adapters",
    "/:companyPrefix/company/settings/instance/environments",
    "/:companyPrefix/company/settings/instance/environments/:environmentId/edit",
    "/:companyPrefix/company/settings/instance/environments/new",
    "/:companyPrefix/company/settings/instance/experimental",
    "/:companyPrefix/company/settings/instance/general",
    "/:companyPrefix/company/settings/instance/heartbeats",
    "/:companyPrefix/company/settings/instance/plugins",
    "/:companyPrefix/company/settings/instance/plugins/:pluginId",
    "/:companyPrefix/company/settings/instance/profile",
    "/:companyPrefix/company/settings/invites",
    "/:companyPrefix/company/settings/members",
    "/:companyPrefix/company/settings/secrets",
    "/:companyPrefix/design-guide",
    "/:companyPrefix/dev/task-chat-lab",
    "/:companyPrefix/instance/settings/adapters",
    "/:companyPrefix/plugins/:pluginId",
    "/:companyPrefix/settings",
    "/:companyPrefix/settings/*",
    "/:companyPrefix/tests/perf/long-thread",
    "/:companyPrefix/u/:userSlug",
    "/companies",
    "/instance",
    "/instance/settings",
    "/instance/settings/*",
    "/settings",
    "/settings/*",
    "/tests/perf/long-thread",
    "/u/:userSlug",
    "/ux-lab/bootstrap-setup",
    "/ux-lab/cross-issue-collaboration",
    "/ux-lab/responsible-user-denial",
  ],
  system: [
    "/assistant-connections",
    "/auth",
    "/board-claim/:token",
    "/chat-identity/confirm",
    "/cli-auth/:id",
    "/dot-connect/:id",
    "/invite/:token",
    "/mcp-connect/:id",
    "/mcp-device",
    "/oauth-handoff",
  ],
  onboarding: [
    "/:companyPrefix/onboarding",
    "/onboarding",
  ],
  container: [
    "/",
    "/:companyPrefix",
  ],
  fallback: [
    "/*",
    "/:companyPrefix/*",
  ],
} as const satisfies Record<CalmAreaId | "system" | "onboarding" | "container" | "fallback", readonly string[]>;

export const CALM_ROUTE_HOMES: readonly CalmRouteHome[] = Object.entries(CALM_ROUTE_GROUPS).flatMap(([group, patterns]) =>
  patterns.map((pattern): CalmRouteHome =>
    ["system", "onboarding", "container", "fallback"].includes(group)
      ? { pattern, kind: group as "system" | "onboarding" | "container" | "fallback" }
      : { pattern, kind: "area", areaId: group as CalmAreaId },
  ),
);

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function matchesHome(pattern: string, pathname: string, companyPrefix?: string): boolean {
  let expression = "";
  for (const segment of pattern.split("/").filter(Boolean)) {
    if (segment === "*") expression += "(?:/.*)?";
    else if (segment === ":companyPrefix" && companyPrefix) expression += `/${escapePattern(companyPrefix)}`;
    else expression += segment.startsWith(":") ? "/[^/]+" : `/${escapePattern(segment)}`;
  }
  return new RegExp(`^${expression || "/"}/?$`, "i").test(pathname);
}

function homeSpecificity(pattern: string): number {
  return pattern.split("/").filter(Boolean).reduce((score, segment) => score + (segment === "*" ? -1 : segment.startsWith(":") ? 2 : 10), 0);
}

const rankedHomes = [...CALM_ROUTE_HOMES].sort((a, b) => homeSpecificity(b.pattern) - homeSpecificity(a.pattern));

export function resolveCalmArea(pathname: string, companyPrefix?: string): CalmAreaId | null {
  const path = pathname.split(/[?#]/, 1)[0] || "/";
  const home = rankedHomes.find((candidate) => matchesHome(candidate.pattern, path, companyPrefix));
  return home?.kind === "area" ? home.areaId : null;
}

export function resolveCalmTab(
  pathname: string,
  companyPrefix?: string,
  settings: Settings = {},
  policy: CalmNavigationPolicy = {},
): string | null {
  const path = pathname.split(/[?#]/, 1)[0] || "/";
  const paths = [path];
  const firstSegment = path.split("/").filter(Boolean)[0];
  const matchingPrefix = companyPrefix && firstSegment?.toLowerCase() === companyPrefix.toLowerCase();
  const home = !companyPrefix ? rankedHomes.find((candidate) => matchesHome(candidate.pattern, path)) : undefined;
  if (matchingPrefix || home?.kind === "area" && home.pattern.startsWith("/:companyPrefix/")) {
    paths.push(`/${path.split("/").filter(Boolean).slice(1).join("/")}`);
  }

  const candidates: { id: string; specificity: number }[] = [];
  for (const area of CALM_AREAS) {
    for (const definition of area.items) {
      if (definition.more || !allowedByPolicy(definition, policy) || definition.visible && !definition.visible(settings)) continue;
      const item = materializeItem(definition, settings);
      const aliases = definition.activePaths ?? [];
      const patterns = [`${item.href.split(/[?#]/, 1)[0]}/*`, ...aliases];
      for (const pattern of patterns) {
        if (paths.some((candidate) => matchesHome(pattern, candidate))) {
          candidates.push({ id: definition.id, specificity: homeSpecificity(pattern) });
        }
      }
    }
  }
  return candidates.sort((a, b) => b.specificity - a.specificity)[0]?.id ?? null;
}
