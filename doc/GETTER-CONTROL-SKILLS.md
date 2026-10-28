# Global skills and company synchronization

Getter Control ships its global skill library in `packages/skills-catalog/catalog`. The generated `packages/skills-catalog/generated/catalog.json` is the inventory used by the UI, server and CLI. The root `skills/` directory remains the operational runtime library.

## Hallmark

The first Getter default is [Hallmark](https://github.com/Nutlope/hallmark), version **2.0.0**, from immutable commit `6033bab2a8051b5454552d2e8e6cb8f27c483a42`. Its stable catalog key is `paperclipai/bundled/design/hallmark`; its catalog ID is `paperclipai:bundled:design:hallmark`. Internal Paperclip identifiers preserve the existing catalog and runtime contracts.

The bundled package contains the official skill instructions, MIT license, Codex agent metadata, design references, 50 theme previews and local helpers. Getter adds catalog frontmatter and pinned source metadata. The original instruction body and auxiliary files retain their source bytes; upstream installer fixtures are excluded, matching the official installation payload. Manifest SHA-256 hashes protect every delivered file. All files needed for installation are local to the app; company installation does not download the repository.

Hallmark helps agents design new pages and interfaces, choose visual directions, and check the result. For an existing interface, explicitly ask for `Hallmark redesign <target>` or `Hallmark audit <target>`. Follow the project's existing design system and Hallmark's own invocation rules.

Local helpers require Node 18 or newer. Static source checks need no npm dependencies. Screenshot and rendered checks additionally require Puppeteer and Chrome/Chromium; see the bundled capture and imagery references for configuration. Optional Together AI image generation requires a separately configured `TOGETHER_API_KEY`. Installing Hallmark does not run these helpers, install browser dependencies, enable Claude hooks, or configure image generation.

## Company libraries

Skills marked `defaultInstall: true` are company bootstrap defaults. Getter reconciles these defaults once during startup and when a company is created. Existing active and paused companies receive missing defaults after updating the app and starting it; archived companies are skipped. Reconciliation uses the normal catalog byte checks and audit, records activity, and keeps each company's files in its own managed skill directory.

An existing key or slug is preserved, including edited content and an older installed version. Automatic bootstrap never forces an update. Use the company's existing audit/update controls to review and apply a later catalog version. A company policy denying installation prevents automatic installation. A blocked or failed default is reported in logs and can be retried on the next startup; it does not prevent the control plane from starting.

The skill record, activity and runtime events commit together. If the transaction fails, no successful installation is recorded. Unreferenced files may remain in the managed catalog directory for a retry to replace; automatic failure cleanup does not delete paths that a concurrent explicit installation might use.

Installing a default into the company library does not change agent assignments. Choose Hallmark in an agent's skill selection or select agents in the existing company skill installation flow. Writes to a selected company skill already publish durable `agent_runtime` events for eligible agents in that company. An owning lifecycle plugin can apply the update to an idle computer; otherwise the next run preparation resolves the selected skill. Existing version pins and access boundaries remain effective.

## Adding another global default

1. Place its reviewed installation payload in `catalog/bundled/<category>/<slug>` with `SKILL.md`, license and required resources. Retain the upstream version, immutable commit and source metadata.
2. Add catalog frontmatter, including a unique canonical key, roles, tags and `defaultInstall: true` when the skill should be copied into company libraries.
3. Regenerate and validate the inventory with `pnpm --filter @paperclipai/skills-catalog build:manifest` and `pnpm --filter @paperclipai/skills-catalog validate`. Keep executable helpers explicitly classified and subject to the existing install audit.
4. Run catalog and company-default tests, then restart Getter Control to reconcile existing companies. New companies receive the defaults during creation.

Global here means the **Getter Control app catalog**. It is independent of personal Codex/Cursor skill folders and of Getter Code, Getter Tots and Jarvis Industrial.
