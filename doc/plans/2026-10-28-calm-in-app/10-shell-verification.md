# CALM B shell verification record

2026-10-28. Baseline: `208d05cb6a00d7a76312f066d29e3a4ed77e81b6`. Branch: `feat/calm-shell`. This record covers the shell, navigation and opt-in flag. Page bodies remain **0 of 128**; all **234 route patterns** have a home. A passing focused check does not clear an earlier material failure.

## Focused checks and review

- Publication preflight removed 29 newly added explanatory comment lines to follow CONTRIBUTING.md. Existing comments and functional test environment directives remain. The guard syntax check and all seven guard tests passed again after this comment-only edit.

- Shared/schema/catalog/server flag checks: 78 tests passed. UI flag and settings checks: 64 passed. Missing settings, false, loading, errors and unavailable query context keep CALM off.
- Registry checks after detail/alias fixes: 89 passed. The AST coverage reads current App routes and the real agent filter constant. It rejects unknown routes, removed aliases and unsupported dynamic declarations.
- Shell integration before review: 156 passed. Later spec fixes: 107 passed across three files. Sidebar and contextual rollback checks: 94 passed across the same three files in a serial recheck. The final legacy-lifecycle regression run passed 96/96 in those three files.
- The first new Cmd K entity test failed in the asynchronous harness. The correction uses the synchronous caches used by existing tests. Both failure and successful recheck remain in local logs.
- A contextual run failed before collecting tests with three Temp/ENOENT errors. The serial run of the same three files passed 94/94. The cause of the first Temp failure remains unproven.
- UI TypeScript checks passed after the contextual owner changes. All three design token checks and five launcher isolation tests passed. The mobile portal-target correction passed the token gate again.
- Independent spec and quality reviews found real regressions in active tabs, drafts, query lifetime and touch targets. Fixes have explicit regression tests. Both reviews now pass for the final shell; a user who never enables CALM retains the legacy Sidebar lifecycle.
- Shared TypeScript passed. The normal server typecheck failed during its Runner-vendor preparation with a Windows absolute-path ESM URL error, before the compiler. A direct run of the server TypeScript compiler passed. This direct result does not clear the failed preparation or the full workspace check.

## Full-suite and platform failures

1. Baseline `pnpm test:run` failed before executing tests on Windows because its command exceeded the command-shell length limit. This is not a passing baseline.
2. A tool-only compatibility adapter runs the unchanged stable runner with the same selection, ordering and isolation. It changes only the `pnpm exec vitest` executable hop to direct Node. It began before the final UI review fixes. The general server block reported 815 failures out of 1,586 tests in `chat-channels.integration.test.ts`, 206 out of 940 in `native-session-executor.test.ts`, two in `environment-runtime.test.ts` and five in `ai-connections.test.ts`. The complete process is still running. These are file-level results, not final totals. The failures' cause is unknown; unchanged files alone do not prove that they are unrelated to the PR.
3. Workspace `pnpm typecheck` failed on the shared package's Unix `mkdir`/`cp` script under Windows. A retry through Git Bash progressed to Rust and failed because GNU `link` was selected instead of an MSVC linker. Neither run is a full typecheck pass.
4. Isolated Linux QA installed pinned Node 26.12.1, pnpm 9.15.4 and Rust 1.97.1, and passed frozen installation and 5/5 launcher tests. The WSL distribution stopped during the build. Its external process returned 1, without a compiler exit result. Two read-only recovery attempts returned `Wsl/Service/CreateInstance/E_FAIL`. Build, typecheck, tokens and full tests did not complete in this attempt. The cause remains unknown; shared WSL services were not restarted.
5. Baseline GitHub run `40637366842` passed build, typecheck and launcher checks. Its unit/integration step was cancelled after approximately 90 minutes, and token checks were skipped. Job logs could not be retrieved. This is not a green full-suite baseline and does not prove the reason for cancellation.

Local evidence is preserved under the task's tools runtime: `calm-baseline-full-tests.log`, `calm-full-tests-direct.log`, `calm-workspace-typecheck.log`, `calm-workspace-typecheck-posix.log`, `calm-linux-evidence-XZexUT/verification-summary.json` and the focused logs named by the builders. These local artifacts are not public CI results.

The proposed fork CI uses the stable runner's official partitions and a guard that reads the real matrix and real dry-run JSON. Its plan must cover the same 1,207 general server files, 162 serialized files and 20 other projects. Native debug/release fixtures must exist before collecting the process tests, so they do not silently skip. A plan proof is not an execution pass. Keep all shard results and logs even when one shard fails.

## Isolated staging and browser evidence

The first staging startup exceeded its 240-second deadline while importing the source server and preparing a fresh database. Its shutdown also exceeded the controller deadline; the owned launcher subsequently exited and its listeners were absent. That failure remains recorded.

A new disposable staging instance started successfully with a longer startup deadline. The API proved a fresh empty company list, an explicit default `enableCalmUi=false`, a PATCH to false and a PATCH to true. Only this staging home was changed. The existing production home was not started or opened.

For navigation verification, staging contains one clearly named synthetic organization and one paused process agent. It has no connected model, no created task and no changed price. The agent does not execute. These fixtures are not real customer data, usage analytics or evidence of industrial production metrics.

Browser checks use a 1280-by-720 desktop viewport and a 390-by-844 phone viewport. They cover the area rail, top-bar tabs, dock, More, tenant-prefixed links, closure on navigation and Cmd K entity search. More has a 358-pixel dialog at the phone width, with page scroll width equal to viewport width. Its close target measures 44 by 44 pixels. Agent menu items initially measured 32 pixels high; the scoped portal rule increases all four to 44. The search input measures 16px. Common command items and portal close controls also receive the mobile 44px minimum.

The final shell was cold loaded. A coordinate click on the agent action trigger confirmed that More stays open and all four menu items measure 44px; no agent action was executed. Cmd K found the synthetic agent and retained quick filters, commands, full search and its original page destinations. The final browser measurement confirms 44px command rows, a 44-by-48px close target and a 16px search input. A filtered diagnostic from the quality reviewer executed one pointerdown/click case successfully; its other 17 cases were not executed by that filter.

Screenshots and fixture records remain local in the tools runtime. The browser viewport is temporary and must be reset. A physical-phone human review has not happened.

## Acceptance still required

- Independent spec and quality rechecks of the final lifecycle fix passed.
- Account for complete tests and CI results. Investigate material failures rather than replacing them with focused pass counts.
- Open the shell draft PR with these limits stated; review and merge only after acceptance.
- Continue Work with its 38-page brief, then other areas, one area per PR.
- Keep production off until a human checks staging and approves activation.
