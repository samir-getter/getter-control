# Approved CALM B — architecture and delivery

2026-10-28. User approved B, minimal with Getter branding, and authorized Phase 3/4. Baseline: 208d05cb6a00d7a76312f066d29e3a4ed77e81b6. Current delivery branch: feat/calm-shell.

## Areas and preservation

| Area | Main tabs | More/contextual destinations |
| --- | --- | --- |
| Work | Overview, Tasks, Projects, Approvals | Inbox, Decisions, Cases, Status, Goals, Workspaces, Execution workspaces, Live dashboard, Search |
| Agents | Agents, Chat | Organization chart, Conference Room, filters, details, runs, configuration, instructions, skills, permissions and plugin tabs |
| Routines | Routines | Details/sections, runs, activity, triggers, variables, secrets, folders/archive |
| Knowledge | Skills, Artifacts | Installed/discover/authored, Studio/create/fork/details, sources and legacy URLs |
| Connections | Connectors, Reviews | Existing app/connection sections, assistant connections, gateways, profiles and tools aliases |
| Audit | Activity, Runs, Costs, Budgets | Commentary, timeline and audit/cost/budget aliases |
| Settings | Company, People, Preferences | Companies, export/import, secrets, environments, access, experimental, adapters, plugins, profile, dev/design surfaces |

Single typed navigation configuration owns areas, tabs, More and exact route homes. Every existing pattern has an explicit area, system, onboarding, container or fallback classification. Dynamic plugins retain their declared host/fallback. A wildcard may classify the registered plugin wildcard, but must never silently cover a new static route. New App.tsx route declarations without a home fail coverage tests; existing aliases cannot disappear without an explicit migration. Existing entity navigation helpers remain authoritative for detail tabs.

The primary rail remains present on desktop across contextual routes. Existing contextual sidebars, slots, starred/recent items, account controls, creation actions and conversation toolbars remain reachable. Area tabs appear in the top bar on both normal and task-detail paths. The mobile dock and More use the same config, preserving safe areas, visible/inert behavior and scroll-reset state. Cmd K's Pages group comes from config; entity search, commands, operators and full search remain intact.

Discovery honors existing flags, including streamlined/legacy, combined/separate Inbox, chats, artifacts, workspaces and developer features. It never changes App gates, authorization, tenant selection or numerical queries. Unsupported tenant values remain unavailable; counters come from the existing services.

## Flag and rollout

Add enableCalmUi to the existing shared schema/types/catalog, default false for self-hosted and Cloud. Include it in both server normalization branches. UI requires explicit true and the streamlined shell; missing/loading/failed settings keep the current shell. Reuse existing GET/PATCH settings, cache updates and invalidation for rollback in seconds; do not add polling or a Vite-only flag requiring rebuild.

Production remains off. A disposable local staging instance will explicitly set enableCalmUi=true using the existing audited settings path. Never start the real .getter-control home for visual verification: startup migrations, recovery and default skills synchronization mutate it. Test fixtures use isolated homes, no model credentials or real customer integrations. Existing company/prices/records stay untouched. No production activation before human staging review.

## Delivery and acceptance

One area per PR. First PR is shell/navigation/flag and route coverage, preserving page bodies. Subsequent PRs address Work first (provisional operational priority), then other areas. Page-specific state, summary/numbers, dangerous tools and drafts are changed only with their area contracts/evidence. Track unique registered page patterns rather than counting conditional registrations as distinct pages. All 234 route patterns remain mapped.

Each builder owns one area with the CALM/accepted IN-APP brief and evidence. At most three builders; they open PRs and stop. Root performs spec review, quality review, integration verification and merge. Run full tests per PR, workspace typecheck/build and relevant token gates. Existing getter-control CI already runs these. Preserve failures through acceptance; a later passing targeted check does not erase an earlier material full-suite failure.

Baseline pnpm test:run failed before executing tests on Windows: general-server exclusions exceeded the command-shell length limit. Log: D:/Gettet/tools/getter-control-runtime/calm-baseline-full-tests.log. Prepare a tool-only direct-Node Vitest invocation of the same stable runner/selection; do not shorten the selected suite. Linux CI remains the standard full-suite check. This is not a passing baseline.

## Checklist

- [x] B approved; seven areas defined; evidence limits explicit.
- [x] One config and live App route-orphan coverage.
- [x] Shell/flag behind switch, production off, isolated staging on.
- [x] Independent spec and quality review of shell and CI plan.
- [ ] Full tests/build/typecheck/token checks accounted for; shell PR merged.
- [ ] Human phone review in staging.
- [ ] Work area completed, then remaining areas with page progress counts.
- [ ] Production flag activation after human approval.
