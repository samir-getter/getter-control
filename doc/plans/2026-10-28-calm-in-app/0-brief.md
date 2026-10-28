# CALM and in-app redesign review brief

Date: 2026-10-28. Baseline: Getter Control, commit `208d05cb6a00d7a76312f066d29e3a4ed77e81b6`.

## Scope and approval gate

1. Evidence first: usage audit, page forensics, number provenance and a complete existing route/action inventory. No application design or implementation during this phase.
2. Self-contained HTML mockups of 5–10 key screens, in desktop and phone layouts, in three directions: A, current business identity lightly trimmed; B, minimal and decluttered; C, bold product look. Compare side by side and recommend a direction. STOP for the user's choice and approval.
3. Only after that approval: information architecture, 4–7 areas, area tabs, More, one navigation configuration, route-coverage test and preserved command search.
4. Only after approved design and architecture: feature-flagged implementation, OFF in production and ON in staging; shell first, then one area per PR; full tests for every PR; human staging review before production activation.

No production source, tests, configuration, prices or business records are changed in phases 1–2. No customer communications or external publication. Mockups are local review artifacts, not connected to write APIs. At most three builders, each with explicit file/area ownership and this brief plus the evidence reports. Builders stop at their reviewable result.

## CALM acceptance criteria

1. The business's own identity, restrained; a small powered-by mark only where appropriate.
2. A clear next action, with actionable states rather than explanatory paragraphs.
3. At-a-glance hierarchy above the fold; no false click targets or rage-click traps.
4. Tabs, filters, search and dates represented in the URL; Back restores state.
5. One page title in the top bar; one quiet numeric summary; no repeated numbers; skeletons for loading.
6. Summary strip on overview only; other tabs begin with their content; history expands on demand.
7. Every existing route and action retained. Rare actions under More. Destructive actions require review/recovery; archive and Undo where supported.
8. Original numeric queries, scopes, windows and formatting preserved; unknown data is not zero.
9. Usage evidence drives priority when measurable; unsupported priorities are labelled provisional.
10. Tenant branding is configurable; shared implementation never hard-codes a customer.

## Phone acceptance criteria

The user's IN-APP checklist was truncated. On 2026-10-28 the user answered “ok” to the proposed phone criteria below. This confirms these review criteria; it does not approve Phase 2 or permit business-data changes:

- One-handed primary actions, comfortable touch targets and a compact mobile navigation surface.
- Safe-area insets and dynamic viewport sizing; no horizontal page overflow.
- In-app navigation and detail presentation; no accidental external browser or tab hops.
- Keyboard-aware input/composer footers; editable text at least 16px.
- URL and Back state persist; unsaved drafts survive unrelated changes, and saves do not race silently.
- Only onboarding before completion, with recovery from errors; established users are not trapped by onboarding.
- Reduced-motion support, immediate keyboard navigation and visible focus states.
- Theme styles scoped to `body:has(.app-shell)` in mockups and, after approval, the implementation.

## Evidence limits

The local API at port 3120 does not respond at the beginning of this review. The persisted source config disables first-party telemetry. Previous QA records showed an empty company list and a global catalog with 18 skills, including Hallmark with 165 files; these are dated QA observations, not current usage analytics. The current generated catalog remains a verifiable source for catalog facts.

Do not label QA traffic as human visits, derive dwell time/rage clicks/dead clicks/device share from missing signals, or invent business metrics. Company-populated mockups require a confirmed existing instance or dataset from the user. Until then, present known catalog facts, genuine onboarding/empty states, and clearly labelled unavailable fields; do not present test companies as real customer data.
