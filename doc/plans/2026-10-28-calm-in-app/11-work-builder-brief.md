# CALM B — Work area builder brief

Prepared on 2026-10-28. This is the execution brief for the **Work area PR after the shell PR merges**. Direction B is approved. The shell has seven areas and an independently reviewed registry for all 234 route patterns. This brief does not start implementation or certify live business numbers.

## Delivery, ownership and evidence

The Work builder owns the 38 page patterns below, their current page modules, and narrow changes to the components that render those pages. The builder is not alone in the repository: preserve other builders' edits, coordinate shared files with root, and do not revert unrelated changes. Use at most two or three builders in the rollout. Deliver one Work area PR, stop after opening it, and let root review and merge. Do not combine Agents, Routines, Knowledge, Connections, Audit or Settings redesigns into this PR.

Read these files before editing:

- `AGENTS.md`, `DESIGN.md`, matching `rules/*.mdc`, and the existing PR template.
- `0-brief.md`: the ten CALM criteria and the phone criteria accepted by the user.
- `1-usage-audit.md`: human usage metrics are unavailable. Work-first is an operational priority, not a measured visit ranking.
- `2-page-forensics.md`, `3-numbers-audit.md`, `4-route-map.md` and `route-map.json`: verified code paths, query contracts, original actions and aliases.
- `7-approved-architecture.md`, `9-rollout-checklist.md` and `9-page-progress.json`: delivery, flag and progress rules.
- Approved B mockups under `mockups/`. They show nine representative screens, not the entire Work area.

The global count is **128 unique registered page patterns**, including ten system pages and two onboarding pages. The Work count is **38**, with several paths sharing one page module. A route mapped by the shell is not a completed body redesign. Mark a pattern complete only after its relevant states, queries, actions and mobile behavior pass review. Retain every old route, alias, plugin contribution and command-search destination; trust the shell's current router-coverage test rather than creating another menu or route snapshot.

Production stays off. Use the existing explicit `enableCalmUi` switch together with Streamlined UI, with missing/loading/error settings remaining off. Synthetic fixtures belong in an isolated test home. Never use customer traffic as analytics, seed a real tenant, contact customers, change prices or live budget policies, or run model/workspace actions merely to fill a screen. Root owns staging and verification environments.

## All 38 page patterns and their owners

All paths below retain the existing company router wrapper and access gates. The page modules are under `ui/src/pages/` unless stated otherwise.

| # | Existing pattern | Current page owner |
| ---: | --- | --- |
| 1 | `/:companyPrefix/dashboard` | `Dashboard.tsx` |
| 2 | `/:companyPrefix/dashboard/live` | `DashboardLive.tsx`, with `components/ActiveAgentsPanel.tsx` |
| 3 | `/:companyPrefix/issues` | `Issues.tsx`, with `components/IssuesList.tsx` |
| 4 | `/:companyPrefix/issues/:issueId` | `IssueDetail.tsx`, task conversation and properties components |
| 5 | `/:companyPrefix/inbox/all` | `Inbox.tsx` |
| 6 | `/:companyPrefix/inbox/blocked` | `Inbox.tsx` |
| 7 | `/:companyPrefix/inbox/mine` | `Inbox.tsx` |
| 8 | `/:companyPrefix/inbox/recent` | `Inbox.tsx` |
| 9 | `/:companyPrefix/inbox/unread` | `Inbox.tsx` |
| 10 | `/:companyPrefix/inbox/requests` | `JoinRequestQueue.tsx` |
| 11 | `/:companyPrefix/approvals/pending` | `Approvals.tsx`, with `components/ApprovalCard.tsx` |
| 12 | `/:companyPrefix/approvals/all` | `Approvals.tsx` |
| 13 | `/:companyPrefix/approvals/:approvalId` | `ApprovalDetail.tsx` |
| 14 | `/:companyPrefix/projects` | `Projects.tsx`, with `components/ProjectsToolbar.tsx` |
| 15 | `/:companyPrefix/projects/:projectId` | `ProjectDetail.tsx` |
| 16 | `/:companyPrefix/projects/:projectId/overview` | `ProjectDetail.tsx`; existing compatibility path |
| 17 | `/:companyPrefix/projects/:projectId/issues` | `ProjectDetail.tsx`, `ProjectIssuesList` and `IssuesList` |
| 18 | `/:companyPrefix/projects/:projectId/issues/:filter` | `ProjectDetail.tsx` |
| 19 | `/:companyPrefix/projects/:projectId/workspaces` | `ProjectDetail.tsx`, with `ProjectWorkspacesContent` |
| 20 | `/:companyPrefix/projects/:projectId/workspaces/:workspaceId` | `ProjectWorkspaceDetail.tsx` |
| 21 | `/:companyPrefix/projects/:projectId/configuration` | `ProjectDetail.tsx`, with `components/ProjectProperties.tsx` |
| 22 | `/:companyPrefix/projects/:projectId/budget` | `ProjectDetail.tsx`, with `components/BudgetPolicyCard.tsx` |
| 23 | `/:companyPrefix/workspaces` | `Workspaces.tsx` |
| 24 | `/:companyPrefix/execution-workspaces/:workspaceId` | `ExecutionWorkspaceDetail.tsx` |
| 25 | `/:companyPrefix/execution-workspaces/:workspaceId/configuration` | `ExecutionWorkspaceDetail.tsx` |
| 26 | `/:companyPrefix/execution-workspaces/:workspaceId/issues` | `ExecutionWorkspaceDetail.tsx` |
| 27 | `/:companyPrefix/execution-workspaces/:workspaceId/routines` | `ExecutionWorkspaceDetail.tsx`; preserve existing routine actions |
| 28 | `/:companyPrefix/execution-workspaces/:workspaceId/runtime-logs` | `ExecutionWorkspaceDetail.tsx` |
| 29 | `/:companyPrefix/execution-workspaces/:workspaceId/services` | `ExecutionWorkspaceDetail.tsx` |
| 30 | `/:companyPrefix/goals` | `Goals.tsx`, with `components/GoalTree.tsx` |
| 31 | `/:companyPrefix/goals/:goalId` | `GoalDetail.tsx`, `GoalProperties` and `GoalTree` |
| 32 | `/:companyPrefix/cases` | `Cases.tsx`, `components/cases/*`; preserve Cases gate |
| 33 | `/:companyPrefix/cases/:caseIdentifier` | `CaseDetail.tsx`; preserve Cases gate |
| 34 | `/:companyPrefix/decisions` | `WhatNeedsMe.tsx`, attention/decision components |
| 35 | `/:companyPrefix/decisions/queues/:key` | `DecisionQueuePage.tsx` |
| 36 | `/:companyPrefix/status` | **`StatusCards/index.tsx`**, tiles and archived rows; preserve Status gate |
| 37 | `/:companyPrefix/status/:cardId` | `StatusCards/index.tsx`, `StatusCardDetailDrawer.tsx`, settings form |
| 38 | `/:companyPrefix/search` | `Search.tsx`, existing search parser and result components |

The audit's inferred `ui/src/pages/StatusCards.tsx` reference is not a real file. `App.tsx:83` imports the folder; its owner is `StatusCards/index.tsx`. Keep this correction in the Work evidence. The page count and route ownership stay unchanged.

Also exercise the existing compatibility destinations from `route-map.json`: `/tasks`, `/issues/all|active|backlog|done|recent`, `/inbox` and its variants, global company redirects, `/status-cards/:cardId`, project identifiers/URL keys and plugin tabs. These do not add unique Work page bodies. `enableCombinedInboxTasks` changes whether Inbox/task aliases resolve to the combined Tasks view or separate Inbox. Preserve both flag combinations. Isolated/execution workspace, Cases, Status, Goals/Decisions discovery, membership and server authorization gates retain their owners.

## Existing contracts to reuse

- Page identity and document titles: `context/BreadcrumbContext.tsx` already supports labels, identifiers, leading/trailing actions, `breadcrumbToolbar`, `breadcrumbPanelControl` and `mobileToolbar`. `components/BreadcrumbBar.tsx:36–86` renders page and plugin toolbar actions. Use these surfaces for the one page title and next action. Register stable leading/trailing keys and clean up page-owned toolbars on exit. Preserve task conversation's existing mobile toolbar rather than appending another toolbar below it.
- Area chrome: keep `CalmAreaTabs`, the single navigation registry, the persistent More supplements, mobile dock, URL wrapper and existing scroll/focus memory. Do not replace `Layout.production`, reorganize unrelated contextual sidebars, or introduce a second token/config/provider source.
- Visual primitives: use `PageSkeleton`, `EmptyState`, `StatusBadge`, `EntityRow`, `CollectionToolbar`, `PageTabBar`, the canonical `Button`, `InlineEditor` and formatters. Put new values in `ui/src/index.css`; scope Work additions to the CALM shell and relevant page/component. New shared component props must default to current behavior for consumers outside Work and with CALM off.
- Summaries: `components/SummarySlotCard.tsx` owns summary GET/revisions, generation status, errors and the explicit Generate action. Keep its selector/company/scope and generation lifecycle. Do not auto-generate summaries on navigation or recompute a summary from a partial task array. Reuse the existing read contracts and expose history only when requested.
- Conversations and edits: retain task `draftKey`, queued comment identity, existing attachment/document/version APIs, field request IDs, shared polling/cache publication and pending/error feedback. Changing appearance must not change checkout, assignment, budget stop, activity logging or execution ownership.

### Overview and title work that the code confirms

`DashboardLive.tsx:34–48`, `JoinRequestQueue.tsx:82`, `WhatNeedsMe.tsx:524`, `DecisionQueuePage.tsx:229`, `StatusCards/index.tsx:119` and `CaseDetail.tsx:98` render page headings in addition to breadcrumbs. Under CALM, keep one authoritative title in the top bar while preserving editable titles and creation/actions through existing toolbar surfaces. A heading count alone does not prove a user suffered confusion; this is a structural checklist gap.

`ProjectDetail.tsx:60–70` maps the old `/overview` alias to **Configuration**, and `:661–688` redirects the bare project root to its cached tab or `/issues`. `SummarySlotCard` is above every tab (`:810`). Under CALM, add a distinct URL-driven overview presentation without deleting those content destinations or silently treating the old `/overview` alias as an equivalent page. A query tab on the canonical root can provide the new overview while retaining the old Configuration alias. Keep Tasks at the existing `/issues` paths; configuration, budget, workspaces and plugin tabs open directly on their content. Show the summary only on the new overview. Preserve explicit URL state, existing remembered-tab behavior and CALM-off behavior; retain search/hash during canonicalization. Document any change to the CALM default landing tab in the PR.

`ExecutionWorkspaceDetail.tsx:75–130` redirects the bare root to Tasks and clears its legacy tab preference; configuration can also redirect when isolation controls are unavailable (`:1014–1020`). Its existing summary is in the Tasks branch (`:1561–1576`). Add an explicit CALM overview state while retaining all six registered content paths, existing gates and plugin contributions. `GoalDetail.tsx:184` uses an uncontrolled Children/Projects tab; its CALM tab state must become URL-driven and its overview summary must not repeat on content tabs. The Status drawer already separates Summary/Settings/Watched/History; preserve that distinction rather than duplicating the summary across them.

## Numbers and requests that must remain unchanged

Preserve request parameters, query keys, enabled conditions, windows, principal/company scope and formatting. This table records source contracts, not a comparison against a populated production database. Before claiming all Work numbers correct, capture permitted GET fixtures and compare the new UI with the same responses; missing/error/unpriced data remains distinct from observed zero.

| Surface | Existing query/fields and source | Constraint |
| --- | --- | --- |
| Dashboard | `dashboardApi.summary(companyId)`; `Dashboard.tsx`, `ui/src/api/dashboard.ts`, `server/src/services/dashboard.ts`; detailed definitions in `3-numbers-audit.md` | Agent headline uses the four defined status groups. Task counts use `executionIssueCondition()`. Pending approval headline combines `pending` approvals and budget incidents. Spend sums `cost_events` from month start UTC through now; preserve budget denominator, retry-recovery classification and 14-day run window. Do not replace with list lengths or persisted spend. |
| Dashboard recent/live | `activityApi.list` limit ten, existing task recency; `DashboardLive.tsx:10` passes limit fifty to `ActiveAgentsPanel` and the existing shared live-run query | “Showing up to 50” is a presentation cap, not the number of all runs. Preserve live/recent ordering, linked-task dedupe, projection and shared polling key. |
| Tasks | `Issues.tsx:254–282` calls `issuesApi.listCompact` with projection `index` when Streamlined, `participantAgentId`, `workspaceId`, `includeRoutineExecutions=true`, `includeAgentCreatedTasks`, existing limit/offset, `updated desc`, and AbortSignal | Preserve stable page merge and `hasMoreServerIssues`. Loaded rows are not a DB total. Existing view/search/client filters and server fill must not silently change projection or include routine/agent-created work differently. |
| Task detail | `IssueDetail.tsx:2891–2944`, `issuesApi.getCostSummary` plus current linked-run reductions | Server descendant-tree cost/runtime differs from the subtotal of loaded history. Preserve include-descendants/root choice, valid-duration run count, token reductions and current history window. |
| Projects list | `projectsApi.list(companyId)` → GET `/companies/:companyId/projects`; `server/src/routes/projects.ts:333–358`, `server/src/services/projects.ts:432–481,727–740`; `Projects.tsx:81–118,151–176` | HTTP defaults to active-only (`includeArchived=false`) and filters allowed projects. Service default is different for internal callers. `taskCount` is company/project `count(*)` excluding `conversationAgentId`, not `executionIssueCondition()` and not the visible task-tab length. List budget is an active `billed_cents` project policy. Preserve API-supplied fields and the exact `formatNumber`, `formatProjectBudget`, date/status formatting. Section counts are filtered membership groups. |
| Project task/workspace content | `ProjectDetail.tsx:222–224` uses `issuesApi.listAll({projectId,includeRoutineExecutions:true,includeAgentCreatedTasks})`; plugin operation list uses `issuesApi.list({projectId,originKindPrefix})`; workspace queries at `:407–434` | Keep the list/plugin/workspace scopes separate. Workspace summaries use both existing task and execution-workspace sources; availability waits for enabled/query decisions and preserves errors. |
| Project budget | `budgetsApi.overview(companyId)` at `ProjectDetail.tsx:493`; select `scopeType=project` and matching scope ID (`:602–630`) | Project policies use lifetime semantics; do not apply a dashboard/month filter. Preserve inactive-policy fallback and paused state. Display/save still use the existing `BudgetPolicyCard` contract and cent units. No live policy changes while testing. |
| Approvals | `approvalsApi.list(companyId)` at `Approvals.tsx:33–41`; detail GET/comments/linked tasks and agents at `ApprovalDetail.tsx:31–52` | Pending badge counts both `pending` and `revision_requested` (`Approvals.tsx:68–74`), unlike Dashboard. Retain read permission filtering, list/detail distinction and linked records. |
| Workspaces | `executionWorkspacesApi.listOverview({offset})`, `Workspaces.tsx:89–114` | Preserve `nextOffset`, per-page items and first-page server `total` fallback. Project group length is a loaded group count, not the global total. Execution detail uses its own get/source/derived/project/operations queries. |
| Goals | `goalsApi.get/list`, `projectsApi.list({includeArchived:true})`; `GoalDetail.tsx:64–123` | Children are filtered by parent ID. Linked projects match goal IDs/references/legacy goal ID. Preserve hierarchy, archived project inclusion and these counts; do not infer progress percentages. |
| Cases | `Cases.tsx:44–90`, `casesApi.list/types`, permitted projects including archived; detail get/children/work/project at `CaseDetail.tsx:40–59` | Server list asks `PAGE_SIZE+1` for pagination; display strips sentinel. Keep range/“+” semantics and include-no-project scope. Do not turn returned page length into total cases. Detail is currently read-only and keeps list search on Back links. |
| Decisions/queues | `attentionApi.list({includeDismissed:true,all:true,activitySince,activityUntil})`; `WhatNeedsMe.tsx:151–188`; queue feed `DecisionQueuePage.tsx:108` | Detailed feed has a distinct cache key from the sidebar badge so dismissed items cannot inflate its count. Decided/expired history loads separately and only when enabled. Keep query bounds, queue filtering and history limits. |
| Status | `StatusCards/index.tsx:39–63,105–114`; existing active/archived/detail fields; updates/revisions/dry-run in drawer; `StatusCards/format.ts` | Today meter sums existing active-card `todayTokens/todayCostCents`. Ledger rollups count compile tokens/cost but exclude compile rows from update count; today uses UTC. Preserve sub-cent formatting, lifetime/today labels, server fields and estimate labels. Never label estimates as observed prices. |
| Full search | `Search.tsx:80–89,104–123,140–216`, `searchApi.search`, parser/filter helpers | Preserve six result/count types: tasks, comments, documents, artifacts, agents and projects, plus All. Result-page length differs from API counts. Preserve operator meanings, relevance/date sort and archived projects in parser context. |

Numbers not yet certified field-by-field include attention denominators, workspace operation summaries, Cases work summaries, Status card server aggregation and provider-specific live-run summaries. Treat these as explicit verification tasks using the existing services. This brief adds project/Status provenance to the earlier evidence; it does not replace the full numbers audit or assert equality between differently scoped numbers.

## URL and Back state

| Family | Verified current behavior | Work requirement |
| --- | --- | --- |
| Tasks | `Issues.tsx:106–131,174–196` reads view, q, participantAgentId, workspace and assignee. q uses `history.replaceState` preserving history.state. `IssuesList` also has stored/local collection preferences. | Retain existing URL keys and alias normalization. Make remaining active filters, group, sort and view state reproducible in the URL without losing repeated values or another control's update. Test detail/Back, rapid controls, Cmd K and company switch. Local preference defaults must not override an explicit URL. |
| Projects | `Projects.tsx:73–75` keeps search and sort only in local state. Detail tab/filter is pathname; plugin tab is `?tab=plugin:…`; canonical redirects currently construct a new URL. | Persist search/sort, preserve hash/unknown state when updating owned keys, and retain query state through canonical aliases and Back. Use the existing project reference/company resolution. |
| Approvals | Pending/All is a pathname; detail uses `resolved=approved`. | Preserve list paths, resolved banner and linked-task navigation. Draft comment is not a filter and must have a separate preservation strategy. |
| Inbox | Tab comes from path; search/group/blocked sort/filter preferences/columns are local or stored (`Inbox.tsx:858–875`). | URL state must coexist with the combined Tasks rollout and old per-company preferences. Keep archive/read/selection and scroll memory. |
| Cases | q/status/type/project/page and sort/dir/group/columns already use URL (`Cases.tsx:44–121`). A latestParams ref composes rapid controls. Detail carries list search. | Preserve this proven pattern, pagination reset and current search string. Test Back and concurrent controls; do not regress it to local state. |
| Decisions/queue | Main page uses `decisionId` deep link; search, group, sort, filters and date/custom bounds are local/stored. Queue uses pathname key with similar local state. | Persist selection/filter/date semantics with the same activity bounds, preserving existing deep links and company preferences. No timezone/window change. |
| Goals | Children/Projects uses `Tabs defaultValue="children"` (`GoalDetail.tsx:184`). | Controlled URL tab, overview-only summary, hierarchy/linked projects retained. |
| Status | Card ID is in path, but showArchived, requested detail tab and drawer revision selection are local (`index.tsx:28–32`, drawer `:56–80`). | URL owns archived visibility, tab and selected history state where applicable; refresh must not reset an unsaved Settings draft or jump to Summary. |
| Search | `buildSearchUrl` owns q/scope/filters/sort; effects synchronize Back/Forward (`Search.tsx:104–178`). | Keep parser and this synchronization, including full-search paths from Cmd K. Preserve unsent query draft according to the existing search behavior rather than treating it as a saved document. |

Use router/navigation helpers. Each URL writer changes only its owned parameters, composes rapid changes against the latest requested URL, preserves hash and unrelated keys, and distinguishes replace-on-typing from push-on-explicit-navigation. Do not create new HTTP semantics to make filters easier.

## Drafts and operations requiring care

**Verified code resets, with reproduction still required:** `ProjectWorkspaceDetail.tsx:318–322` and `ExecutionWorkspaceDetail.tsx:899–905` replace the complete form whenever the workspace object changes. `StatusCardDetailDrawer.tsx:69–80` reloads settings/title/interest/agent and revision selection whenever card changes. These effects can replace dirty input after a same-entity refetch or an unrelated operation; no browser reproduction is claimed here. Add a dirty/entity-aware merge or existing recovery mechanism before calling these pages CALM complete. Preserve current cancellation and explicit Reset behavior. Test same-entity remote updates, success/failure and switching to a different entity/company.

`ApprovalDetail.tsx:27` keeps commentBody locally without a shown persistence guard. Task conversation has a real draft key (`IssueDetail.tsx:2708`) and incremental history. `ProjectDetail.tsx:340–343,580–599` has per-field request IDs/save feedback, and `InlineEditor` owns autosave/draft behavior; preserve those contracts and verify save ordering. Request IDs on UI feedback alone are not proof that racing server writes cannot commit out of order.

| Action family | Existing operations and recovery | Required presentation/testing |
| --- | --- | --- |
| Tasks/Inbox | Create/update status/assignee/project/work mode; comments, documents, attachments; queue edit/reorder/steer/discard; retry/stop/cancel/tree holds. `archiveFromInbox` and `unarchiveFromInbox` supply actual Inbox Undo (`Inbox.tsx:1966–2037`, `IssueDetail.tsx:4298–4320`). | Keep named action, target, pending/error/result, version/idempotency/observed-run constraints. Review irreversible/destructive effects. Inbox archive is not task deletion. Continuation already dispatching cannot be promised reversible. Preserve composer over keyboard, one scroller and drafts during property/refetch changes. |
| Approvals/membership | Approve/reject, request revision/resubmit, comments and linked tasks. List ApprovalCard currently invokes resolve directly. Join request approve/reject changes access. Detail can DELETE a disapproved agent with an irreversible native confirmation (`ApprovalDetail.tsx:135,315–319`). | Review effect before governed actions, keep current authorization and payload. Move dangerous tools to More with a clear review step; preserve the existing operation without inventing archive/Undo endpoints. Never execute agent deletion or membership changes against a real tenant during QA. |
| Projects | Existing create/edit/star/join/leave, image upload, fields and budget policy. Archive/unarchive is `projectsApi.update({archivedAt:timestamp/null})` (`ProjectDetail.tsx:461–482`). | Retain membership/private visibility, pending state and plugin-managed restrictions. Archive has a supported restore path; offer recovery using that API. Budget amount/unit/scope/impact need review. No new financial calculations or test price changes. |
| Project/execution workspaces | Save/set primary, runtime start/stop/restart/run, close/archive and operation/log views. API carries sanitized runtime targets. Execution Routines tab has existing run dialog. | Review the exact service/command/target and dirty work before execution or close. Keep target sanitization, preview/close dialog, operation result and failed-save recovery. Do not replace stop with delete or start a process just to verify styling. Existing routine actions remain in this Work view; routine redesign is a later area. |
| Decisions/queues | Existing decision actions in attention components; queue seed-rule update and remove-item reason (`DecisionQueuePage.tsx:206,437–448`). | Keep reasons, pending-hide/restore flows and source restrictions. Do not count hidden rows twice or introduce an irreversible dismissal without its existing recovery semantics. |
| Status | Create/edit, explicit refresh/recompile, archive/restore by `statusCardsApi.patch({archived:true/false})` (`index.tsx:75–95`); history/query debug. | Preserve supported restore and review refresh/recompile effects. Queries, interest and credentials/provider settings remain in their owning services. No automatic generation or claimed rollback of an already-run model update. |
| Cases/Goals/Search | Cases detail is explicitly read-only; goal create/update hierarchy and title/description/image; search navigates existing entities. | Preserve read-only Cases behavior; do not add write controls to make a next action. Keep editable goal titles/properties and legitimate search operators/result types reachable. |

## Every Work page must pass both checklists

CALM:

1. Getter identity with tenant brand data through current contracts; a restrained powered-by mark when relevant. Shared code must not hard-code Jabil or any customer.
2. One clear next action from observed state: waiting/overdue/ready or a genuine empty-state action, with concise status chips.
3. Useful information above the fold, no false click targets, and internal row actions independent from row navigation.
4. Tabs, active filters, search and dates in the URL; Back restores state.
5. Page title in the top bar, one quiet numeric line, no repeated value/title, skeletons for initial loading and preserved successful data during refetch.
6. Detail begins with status/value/next action/last activity/source summary only on overview; other tabs begin with their content; history expands on demand.
7. All old pages/actions keep a destination. More contains rare tools; dangerous operations show review and their real archive/restore/Undo capability. Unsupported reversibility is explicit.
8. Same queries, fields, units, formatting, visibility, windows and denominators. Unknown/unpriced/error does not become zero.
9. Priority is provisional until analytics exist. No invented usage ranking or customer metrics.
10. Works for every tenant/brand and preserves existing feature/access gates.

Phone:

- One-handed primary actions and at least 44px comfortable targets, including reused row/menu/panel controls and close actions.
- Safe-area insets and dynamic viewport sizing, no horizontal page overflow; scoped CALM styles under `body:has(.app-shell.calm-shell)`.
- In-app navigation/details; preserve legitimate external links without accidental tab/browser hops.
- Keyboard-aware fields/composer/footer, editable text at least the 16px base token, one conversation scroller, opaque dock and stable padding.
- URL/Back, draft identity and save ordering survive unrelated field changes, refetch, tab navigation and flag rollback.
- Existing onboarding protections stay intact; do not trap established users or treat a failed/refreshing agent query as an empty organization.
- Visible focus, reduced motion, semantic dialog/focus/inert behavior and immediate keyboard navigation.

## Verification and handoff

Begin from the merged shell commit and capture its SHA. Enumerate the 38 patterns and enabled/disabled states in the PR. Use meaningful page/component tests for each changed family and original request contracts. Avoid tests that merely mirror CSS/implementation.

Required regressions include: combined/separate task aliases; list/detail/Back and rapid URL controls; query equality for Dashboard/Tasks/Projects/Approvals; same-entity dirty workspace/Status refetch; comment and conversation draft preservation; failing/reordered saves; summary only on overview; existing plugin tabs/actions and hidden feature states; governed action review/actual supported recovery; all six search types; phone targets/overflow/keyboard/focus and CALM-off behavior. Keep standard task New form fast and draft-safe while choices load.

Run the full suite for this PR, workspace typecheck/build and token gates. Record environment, source SHA, exact commands and results. Preserve earlier material failures through acceptance; a successful focused retry does not erase the shell's documented Windows runner/script/Rust issues or cancelled baseline CI. Root reviews specification, quality and integration before merge. Human staging review on a physical phone precedes production activation.

Update `9-page-progress.json` and `9-rollout-checklist.md` only for accepted page bodies, preserving the 128 denominator. After Work merges, root tells the user in plain language what changed and what to check on their phone. Existing tests, isolated browser evidence and a completed route map are separate claims; none alone certifies all CALM pages or production rollout.
