import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness, Users, Repeat, Library, Unplug, ChartNoAxesCombined,
  Settings, MoreHorizontal, Search, SquarePen, type LucideIcon,
} from "lucide-react";
import type { InstanceExperimentalSettings } from "@paperclipai/shared";
import { Link, useLocation, useParams } from "@/lib/router";
import { getCalmNavigation, resolveCalmArea, resolveCalmTab, type CalmAreaId } from "@/lib/calm-navigation";
import { SIDEBAR_SCROLL_RESET_STATE } from "@/lib/navigation-scroll";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { queryKeys } from "@/lib/queryKeys";
import { useCalmNavigationPolicy } from "@/hooks/useCalmNavigationPolicy";
import { useDialogActions } from "@/context/DialogContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const areaIcons: Record<CalmAreaId, LucideIcon> = {
  work: BriefcaseBusiness, agents: Users, routines: Repeat, knowledge: Library,
  connections: Unplug, audit: ChartNoAxesCombined, settings: Settings,
};

function useNavigationSettings() {
  return useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  }).data;
}

export function usePersistentNavigationRegion(id: string) {
  const [container] = useState(() => {
    if (typeof document === "undefined") return null;
    const node = document.createElement("div");
    node.className = "contents";
    return node;
  });
  const parkingRef = useRef<HTMLDivElement>(null);
  const attach = useCallback((slot: HTMLDivElement | null) => {
    const host = slot ?? parkingRef.current;
    if (container && host) host.append(container);
  }, [container]);
  useLayoutEffect(() => {
    if (container && !container.parentNode) attach(null);
  }, [attach, container]);
  return {
    contentHost: <div ref={attach} className="contents" data-navigation-region-slot={id} />,
    parkingHost: <div ref={parkingRef} hidden inert aria-hidden="true" data-navigation-region-parking={id} />,
    renderContent: (content: ReactNode) => container ? createPortal(content, container, id) : null,
  };
}

export function CalmMoreNavigation({
  settings, children, trigger,
}: {
  settings?: Partial<InstanceExperimentalSettings>;
  children?: ReactNode;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const shortcuts = usePersistentNavigationRegion("calm-more-shortcuts");
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname, location.search, location.hash]);
  const policy = useCalmNavigationPolicy();
  const areas = getCalmNavigation(settings, policy);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="ghost" className="calm-more-trigger"><MoreHorizontal aria-hidden="true" /><span>More</span></Button>}
      </DialogTrigger>
      <DialogContent className="calm-more-dialog">
        <DialogHeader>
          <DialogTitle>All areas</DialogTitle>
          <DialogDescription>{children ? "Find a page or return to your recent work." : "Find a page in any area."}</DialogDescription>
        </DialogHeader>
        <div className="calm-more-content">
          {areas.map((area) => {
            const Icon = areaIcons[area.id];
            return <section key={area.id} className="calm-more-group">
              <h3><Icon aria-hidden="true" />{area.label}</h3>
              <div>{area.items.map((item) => <Link
                key={item.id} to={item.href} state={SIDEBAR_SCROLL_RESET_STATE}
                className="calm-more-link" onClick={() => setOpen(false)}
              >{item.label}</Link>)}</div>
            </section>;
          })}
          {children ? shortcuts.contentHost : null}
        </div>
      </DialogContent>
      {children ? shortcuts.parkingHost : null}
      {children ? shortcuts.renderContent(<section className="calm-more-shortcuts"><h3>Recent work and shortcuts</h3>{children}</section>) : null}
    </Dialog>
  );
}

export function CalmSidebarNavigation({ settings, unread = 0, failed = false, children }: {
  settings?: Partial<InstanceExperimentalSettings>;
  unread?: number;
  failed?: boolean;
  children?: ReactNode;
}) {
  const { openNewIssue } = useDialogActions();
  const policy = useCalmNavigationPolicy();
  const location = useLocation();
  const { companyPrefix } = useParams<{ companyPrefix?: string }>();
  const currentArea = resolveCalmArea(location.pathname, companyPrefix);
  return <nav className="calm-area-rail" aria-label="Work areas">
    <Button variant="ghost" className="calm-rail-action" onClick={() => openNewIssue()} aria-label="New Task"><SquarePen aria-hidden="true" /><span>New Task</span></Button>
    <Link to="/search" className="calm-rail-action" state={SIDEBAR_SCROLL_RESET_STATE}><Search aria-hidden="true" /><span>Search</span></Link>
    {getCalmNavigation(settings, policy).map((area) => {
      const Icon = areaIcons[area.id];
      const active = area.id === currentArea;
      return <Link key={area.id} to={area.href} state={SIDEBAR_SCROLL_RESET_STATE}
        className="calm-area-link" data-active={active || undefined} aria-current={active ? "page" : undefined}>
        <span className="calm-area-icon"><Icon aria-hidden="true" />
          {area.id === "work" && unread > 0 ? <Badge variant={failed ? "destructive" : "ghost"} className="calm-area-badge">{unread > 99 ? "99+" : unread}</Badge> : null}
        </span><span>{area.label}</span>
      </Link>;
    })}
    <CalmMoreNavigation settings={settings}>{children}</CalmMoreNavigation>
  </nav>;
}

export function CalmAreaTabs() {
  const settings = useNavigationSettings();
  const policy = useCalmNavigationPolicy();
  const location = useLocation();
  const { companyPrefix } = useParams<{ companyPrefix?: string }>();
  const areaId = resolveCalmArea(location.pathname, companyPrefix);
  const area = getCalmNavigation(settings, policy).find((candidate) => candidate.id === areaId);
  if (!area) return null;
  const tabs = area.items.filter((item) => !item.more);
  const activeTabId = resolveCalmTab(location.pathname, companyPrefix, settings, policy);
  return <div className="calm-area-topbar">
    <img className="calm-brand-mark" src="/getter-control.svg" alt="Getter Control" />
    <span className="calm-area-label">{area.label}</span>
    <nav aria-label={`${area.label} pages`} className="calm-area-tabs">
      {tabs.map((item) => <Link key={item.id}
        to={item.href} state={SIDEBAR_SCROLL_RESET_STATE} className="calm-area-tab"
        aria-current={item.id === activeTabId ? "page" : undefined}
      >{item.label}</Link>)}
    </nav>
    <CalmMoreNavigation settings={settings} trigger={<Button variant="ghost" size="icon" className="calm-topbar-more" aria-label={`More ${area.label} pages`}><MoreHorizontal aria-hidden="true" /></Button>} />
  </div>;
}

export function CalmMobileNavigation({ unread, failed }: { unread: number; failed: boolean }) {
  const settings = useNavigationSettings();
  const policy = useCalmNavigationPolicy();
  const { openNewIssue } = useDialogActions();
  const location = useLocation();
  const { companyPrefix } = useParams<{ companyPrefix?: string }>();
  const activeArea = resolveCalmArea(location.pathname, companyPrefix);
  const areas = getCalmNavigation(settings, policy);
  const work = areas.find((area) => area.id === "work")!;
  const tasks = work.items.find((item) => item.id === "tasks") ?? work.items.find((item) => item.href === "/issues");
  const knowledge = areas.find((area) => area.id === "knowledge")!;
  return <div className="calm-mobile-items">
    <Link to={tasks?.href ?? work.href} state={SIDEBAR_SCROLL_RESET_STATE} className="calm-mobile-link" aria-current={activeArea === "work" ? "page" : undefined}>
      <span className="calm-area-icon"><BriefcaseBusiness aria-hidden="true" />{unread > 0 ? <Badge variant={failed ? "destructive" : "ghost"} className="calm-area-badge">{unread > 99 ? "99+" : unread}</Badge> : null}</span><span>Tasks</span>
    </Link>
    <Button variant="ghost" className="calm-mobile-link" onClick={() => openNewIssue()}><SquarePen aria-hidden="true" /><span>New Task</span></Button>
    <Link to={knowledge.href} state={SIDEBAR_SCROLL_RESET_STATE} className="calm-mobile-link" aria-current={activeArea === "knowledge" ? "page" : undefined}><Library aria-hidden="true" /><span>{knowledge.label}</span></Link>
    <CalmMoreNavigation settings={settings} trigger={<Button variant="ghost" className="calm-mobile-link"><MoreHorizontal aria-hidden="true" /><span>More</span></Button>} />
  </div>;
}
