# CALM B rollout checklist

User approved direction B on 2026-10-28. Navigation covers all 234 existing route patterns. This checklist counts 128 unique registered page patterns; duplicated conditional registrations are not counted twice.

**Page bodies completed: 0 of 128.** The shell is in review. A mapped destination is not a completed page redesign.

| Area | Unique page patterns | Page bodies done | Delivery |
| --- | ---: | ---: | --- |
| Work | 38 | 0 | First page area after shell |
| Agents | 12 | 0 | Own area PR after shell |
| Routines | 3 | 0 | Own area PR after shell |
| Knowledge | 7 | 0 | Own area PR after shell |
| Connections | 20 | 0 | Own area PR after shell |
| Audit | 7 | 0 | Own area PR after shell |
| Settings | 29 | 0 | Own area PR after shell |
| System | 10 | 0 | Protocol/onboarding review; preserve existing flows |
| Onboarding | 2 | 0 | Protocol/onboarding review; preserve existing flows |

The order is provisional because the usage audit has no human analytics. Reorder remaining areas when verified visits, friction and phone share are available. Exact page patterns and their current owner are in `9-page-progress.json`; the live router coverage test remains authoritative for navigation.

## Shell acceptance

- [x] Direction B approved; seven areas specified.
- [x] One navigation registry; all original routes and aliases mapped.
- [x] Live App AST coverage and unknown-route failure tests.
- [x] Flag defaults off and isolated staging explicitly on.
- [x] Independent specification and quality reviews complete for the shell and CI plan.
- [ ] Full suite, build, typecheck and token-gate results accounted for.
- [ ] Shell PR reviewed and merged.
- [ ] Human checks staging on a physical phone.

## Every area PR

- [ ] Written brief with the CALM and accepted phone checklists plus evidence/query contracts.
- [ ] All old routes and actions retain a home; Cmd K retains entity search.
- [ ] URL, Back, filters, drafts and save ordering verified.
- [ ] Original numeric queries and formatting retained; unavailable data is not zero.
- [ ] Overview summary and next action; details on demand; destructive actions have supported recovery.
- [ ] Phone safe areas, comfortable targets, keyboard, no overflow and reduced motion verified.
- [ ] Full tests run; previous failures remain documented until explained.
- [ ] Builder opens PR and stops; root reviews and merges.
- [ ] Root explains changes and phone checks to the user; count updated.

Production stays off until a human checks staging and approves activation. Test companies are synthetic fixtures in an isolated home; they are never usage evidence or customer data.
