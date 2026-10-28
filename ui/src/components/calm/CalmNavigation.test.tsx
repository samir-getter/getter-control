// @vitest-environment jsdom

import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/queryKeys";
import { SIDEBAR_SCROLL_RESET_STATE } from "@/lib/navigation-scroll";
import {
  CalmAreaTabs,
  CalmMobileNavigation,
  CalmMoreNavigation,
  CalmSidebarNavigation,
} from "./CalmNavigation";

const mocks = vi.hoisted(() => ({
  openNewIssue: vi.fn(),
  getExperimental: vi.fn(),
}));

vi.mock("@/context/DialogContext", () => ({
  useDialogActions: () => ({ openNewIssue: mocks.openNewIssue }),
}));
vi.mock("@/context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompany: { issuePrefix: "OTHER" } }),
}));
vi.mock("@/api/instanceSettings", () => ({
  instanceSettingsApi: { getExperimental: mocks.getExperimental },
}));

const areas = [
  ["Work", "/dashboard"],
  ["Agents", "/agents/all"],
  ["Routines", "/routines"],
  ["Knowledge", "/skills"],
  ["Connections", "/apps"],
  ["Audit", "/activity"],
  ["Settings", "/company/settings"],
] as const;

function LocationProbe() {
  const location = useLocation();
  return <output data-location data-state={JSON.stringify(location.state)}>
    {location.pathname}{location.search}
  </output>;
}

describe("CALM navigation", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    client.setQueryData(queryKeys.instance.experimentalSettings, { enableStreamlinedUi: true });
    mocks.getExperimental.mockResolvedValue({ enableStreamlinedUi: true });
  });

  afterEach(async () => {
    await act(() => root.unmount());
    client.clear();
    host.remove();
    vi.resetAllMocks();
  });

  async function render(content: ReactNode, initialPath = "/ACME/issues") {
    await act(() => root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter key={initialPath} initialEntries={[initialPath]}>
          <Routes>
            <Route path="/:companyPrefix/*" element={<>{content}<LocationProbe /></>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ));
  }

  async function click(element: HTMLElement | null) {
    expect(element).not.toBeNull();
    await act(() => element!.click());
  }

  function linkWithText(scope: ParentNode, label: string): HTMLAnchorElement | undefined {
    return Array.from(scope.querySelectorAll<HTMLAnchorElement>("a"))
      .find((link) => link.textContent?.trim() === label);
  }

  it.each(["ACME", "BETA"])("shows all seven areas and retains the %s company in real router links", async (prefix) => {
    await render(<CalmSidebarNavigation />, `/${prefix}/apps/review`);
    const rail = host.querySelector('nav[aria-label="Work areas"]')!;
    const links = Array.from(rail.querySelectorAll<HTMLAnchorElement>("a.calm-area-link"));
    expect(links.map((link) => link.textContent?.trim())).toEqual(areas.map(([label]) => label));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(areas.map(([, path]) => `/${prefix}${path}`));
    expect(rail.querySelectorAll('a[aria-current="page"]')).toHaveLength(1);
    expect(rail.querySelector('a[aria-current="page"]')?.textContent).toBe("Connections");
    expect(linkWithText(rail, "Search")?.getAttribute("href")).toBe(`/${prefix}/search`);
    await click(linkWithText(rail, "Routines") ?? null);
    expect(host.querySelector("[data-location]")?.textContent).toBe(`/${prefix}/routines`);
    expect(JSON.parse(host.querySelector("[data-location]")!.getAttribute("data-state")!))
      .toEqual(SIDEBAR_SCROLL_RESET_STATE);
  });

  it("opens the existing New Task action from both the rail and phone dock", async () => {
    await render(<>
      <CalmSidebarNavigation />
      <CalmMobileNavigation unread={0} failed={false} />
    </>);
    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
      .filter((button) => button.textContent?.trim() === "New Task");
    expect(buttons).toHaveLength(2);
    await click(buttons[0]!);
    await click(buttons[1]!);
    expect(mocks.openNewIssue).toHaveBeenCalledTimes(2);
    expect(mocks.openNewIssue).toHaveBeenNthCalledWith(1);
    expect(mocks.openNewIssue).toHaveBeenNthCalledWith(2);
  });

  it.each([
    [37, "37"],
    [137, "99+"],
    [0, null],
  ] as const)("preserves the existing unread badge presentation for %i unread items", async (unread, label) => {
    await render(<>
      <CalmSidebarNavigation unread={unread} failed />
      <CalmMobileNavigation unread={unread} failed />
    </>);
    const badges = Array.from(host.querySelectorAll(".calm-area-badge"));
    expect(badges.map((badge) => badge.textContent)).toEqual(label ? [label, label] : []);
    for (const badge of badges) expect(badge.getAttribute("data-variant")).toBe("destructive");
  });

  it.each([
    ["/apps", "Connectors"],
    ["/apps/review", "Reviews"],
    ["/apps/review/REV-14", "Reviews"],
    ["/APPS/REVIEW", "Reviews"],
  ])("marks only the most specific connections tab at %s", async (path, currentLabel) => {
    await render(<CalmAreaTabs />, `/ACME${path}`);
    const tabs = host.querySelector('nav[aria-label="Connections pages"]')!;
    expect(Array.from(tabs.querySelectorAll("a")).map((link) => link.textContent))
      .toEqual(["Connectors", "Reviews"]);
    expect(tabs.querySelectorAll('a[aria-current="page"]')).toHaveLength(1);
    expect(tabs.querySelector('a[aria-current="page"]')?.textContent).toBe(currentLabel);
    expect(linkWithText(tabs, "Reviews")?.getAttribute("href")).toBe("/ACME/apps/review");
    expect(linkWithText(tabs, "Advanced tools")).toBeUndefined();
    expect(host.querySelector('button[aria-label="More Connections pages"]')).not.toBeNull();
  });

  it("keeps rare pages in More, retains query state, and closes after navigation", async () => {
    await render(<CalmMoreNavigation><span>Pinned draft</span></CalmMoreNavigation>);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await click(host.querySelector("button"));
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(Array.from(dialog.querySelectorAll(".calm-more-group h3")).map((heading) => heading.textContent))
      .toEqual(areas.map(([label]) => label));
    for (const [label, path] of [
      ["Membership requests", "/inbox/requests"],
      ["Skill sources", "/skills/sources"],
      ["Secrets", "/company/settings/secrets"],
    ]) expect(linkWithText(dialog, label)?.getAttribute("href")).toBe(`/ACME${path}`);
    expect(dialog.textContent).toContain("Recent work and shortcuts");
    expect(dialog.textContent).toContain("Pinned draft");
    await click(linkWithText(dialog, "Discover skills") ?? null);
    expect(host.querySelector("[data-location]")?.textContent).toBe("/ACME/skills?tab=discover");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("uses cached hosting visibility for More and settings tabs", async () => {
    client.setQueryData(queryKeys.health, {
      cloud: { stackId: "demo-stack" },
      hiddenSettings: ["company.members", "company.secrets", "instance.experimental", "instance.profile"],
    });
    await render(<><CalmAreaTabs /><CalmMoreNavigation /></>, "/ACME/company/settings");
    const tabs = host.querySelector('nav[aria-label="Settings pages"]')!;
    expect(Array.from(tabs.querySelectorAll("a")).map((link) => link.textContent)).toEqual(["Company"]);
    await click(host.querySelector(".calm-more-trigger"));
    const dialog = document.querySelector('[role="dialog"]')!;
    for (const label of ["People", "Preferences", "Secrets", "Experimental features", "Import"])
      expect(linkWithText(dialog, label)).toBeUndefined();
    expect(linkWithText(dialog, "Export")).toBeDefined();
  });

  it("closes More when an existing supplemental shortcut changes the route", async () => {
    const { Link } = await import("@/lib/router");
    await render(<CalmMoreNavigation><Link to="/issues/ACME-7">Recent unsaved task</Link></CalmMoreNavigation>);
    await click(host.querySelector("button"));
    const dialog = document.querySelector('[role="dialog"]')!;
    await click(linkWithText(dialog, "Recent unsaved task") ?? null);
    expect(host.querySelector("[data-location]")?.textContent).toBe("/ACME/issues/ACME-7");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it.each([
    ["/BETA/agents/agent-7/configuration", "Agents pages", "Agents"],
    ["/BETA/approvals/all", "Work pages", "Approvals"],
    ["/BETA/approvals/approval-7", "Work pages", "Approvals"],
  ])("keeps a primary tab selected for tenant detail/alias %s", async (path, navLabel, tabLabel) => {
    await render(<CalmAreaTabs />, path);
    const nav = host.querySelector(`nav[aria-label='${navLabel}']`)!;
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe(tabLabel);
    expect(nav.querySelector('a')?.getAttribute("href")).toMatch(/^\/BETA\//);
  });

  it("keeps supplemental plugin state mounted and inert between More sessions", async () => {
    function StatefulPluginPanel() {
      const [edits, setEdits] = useState(0);
      return <div><textarea aria-label="Plugin draft" defaultValue="" />
        <button onClick={() => setEdits((value) => value + 1)}>Plugin edits {edits}</button></div>;
    }
    await render(<CalmMoreNavigation><StatefulPluginPanel /></CalmMoreNavigation>);
    const trigger = host.querySelector<HTMLButtonElement>(".calm-more-trigger")!;
    const originalPointerEvents = document.body.style.pointerEvents;
    const parked = host.querySelector('[data-navigation-region-parking="calm-more-shortcuts"]')!;
    expect(parked.hasAttribute("hidden")).toBe(true);
    expect(parked.hasAttribute("inert")).toBe(true);
    expect(parked.getAttribute("aria-hidden")).toBe("true");
    const draft = parked.querySelector<HTMLTextAreaElement>('textarea[aria-label="Plugin draft"]')!;
    await click(trigger);
    let dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('textarea[aria-label="Plugin draft"]')).toBe(draft);
    expect(draft.closest('[inert]')).toBeNull();
    draft.value = "Unsaved plugin notes";
    await click(Array.from(dialog.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "Plugin edits 0") ?? null);
    await click(dialog.querySelector('[data-slot="dialog-close"]'));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.pointerEvents).toBe(originalPointerEvents);
    expect(document.activeElement).toBe(trigger);
    expect(parked.querySelector('textarea[aria-label="Plugin draft"]')).toBe(draft);
    expect(draft.value).toBe("Unsaved plugin notes");
    expect(parked.textContent).toContain("Plugin edits 1");
    await click(host.querySelector(".calm-more-trigger"));
    dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('textarea[aria-label="Plugin draft"]')).toBe(draft);
    expect(draft.value).toBe("Unsaved plugin notes");
    expect(dialog.textContent).toContain("Plugin edits 1");
  });

  it("puts exactly Tasks, New Task, Knowledge and More in the phone dock", async () => {
    await render(<CalmMobileNavigation unread={0} failed={false} />, "/ACME/skills/sources");
    const dock = host.querySelector(".calm-mobile-items")!;
    const entries = Array.from(dock.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>("a, button"));
    expect(entries.map((entry) => entry.textContent?.trim())).toEqual(["Tasks", "New Task", "Knowledge", "More"]);
    expect(entries[0]?.getAttribute("href")).toBe("/ACME/issues");
    expect(entries[2]?.getAttribute("href")).toBe("/ACME/skills");
    expect(dock.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(dock.querySelector('[aria-current="page"]')?.textContent).toBe("Knowledge");
    await click(entries[3]!);
    expect(linkWithText(document.querySelector('[role="dialog"]')!, "Advanced tools")?.getAttribute("href"))
      .toBe("/ACME/apps/advanced");
  });
});
