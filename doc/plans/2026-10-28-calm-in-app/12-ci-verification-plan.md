# Getter Control full test verification

2026-10-28. This is CI support for the CALM shell PR. It does not change application code, test selection, numerical queries, production flags or the stable test runner.

## Problem and scope

The original Getter Control source job ran the full Vitest sequence after build and typecheck. The baseline workflow run 40637366842 had successful build and typecheck steps, then a cancelled unit/integration step after about 90 minutes. The cause of cancellation remains unconfirmed. The monolithic server defaults to one worker; the official sharded entry point permits two isolated files per worker host where no shared test database is configured.

The Windows baseline also failed before collection because its command exceeded the shell limit. A direct-Node run reached the chat integration suite and reported 815 failures among 1,586 cases; the cause remains unknown. The isolated WSL verification installed the locked dependencies and passed five launcher tests, then the distribution ended during build and subsequent entry attempts returned E_FAIL. These are unresolved verification failures. A passing selection guard does not replace them with a passing full suite.

The first shell head `d0aca8488ef085d1e486aaba9e93eb916d282cb7` produced run `40731115580`, which GitHub rejected before creating any job. Its validation reported four uses of the unavailable `runner` context in job-level environment values. Actionlint 1.7.12 reproduced all four errors. This was a workflow validation failure, not an executed test result. The correction initializes application homes in an early Bash step through `RUNNER_TEMP` and `GITHUB_ENV`.

Run `40733380430` executed the corrected workflow and passed the source build, typecheck, token checks, five launcher tests and eleven guard tests. Its source artifact step reported at `2026-10-28T17:26:01.830Z` that `.ci-test-logs/` contained no uploadable files, and the artifacts API returned an empty list. The upload action excludes hidden directories by default. A successful upload step therefore did not prove that the logs were preserved. Both uploads now explicitly include hidden files within the scoped log directory and fail if no files exist. Test lanes in that run produced both passing and failing results; this artifact correction does not clear those failures or establish complete test acceptance.

Run [40744557017](https://github.com/samir-getter/getter-control/actions/runs/40744557017) completed all 30 jobs with 29 successes and one failure on head `31ef02c71c7c4c9846c51430db64315eb31e8b23`. The checked-out PR merge revision was `ce7bc7a06edafbc15f1e68da5a85d819d2c891bb`; both revisions have tree `d4269ecb238b7701d32e7462ff8da650a0d6189c`. All 29 lane JSONs record that merge revision. Source passed build, typecheck, token gates, five launcher tests and twelve guard tests. Thirty actual artifacts were downloaded and verified against their published digests. Artifact delivery is therefore proven for this run, including the failed lane.

The failed UI/CLI second slice reported three `CompanySettings.test.tsx` failures at lines 252, 303 and 379: the expected environment form was null. That UI slice had 5,263 passes; its subsequent CLI project did not execute. General server reported 24,804 passes and 81 conditional skips. Chat's complete union of 1,586 cases passed; per-worker filters do not represent missing cases from that union. Serialized server passed 3,551 cases across all 162 files without skips. Native passed 115 cases with five explicit remote-container skips. Other packages passed 5,256 with twelve conditional skips; database passed 271 without skips. The first UI/CLI slice passed 4,213 UI and 292 CLI cases. These results do not establish complete acceptance: the three failures, unexecuted CLI slice and actual conditional coverage gaps remain recorded.

The skip audit found six General cases that lost a build fixture when tests moved into independent checkouts. The original workflow at `a7f0ebd` ran `pnpm build`, typecheck and `pnpm test:run` in the same checkout. Runner `build:binary` compiles release `paperclip-runnerd` and stages it into `dist/bin`. Actual Source `build.log` lines 73–74 and 687 confirm that compilation and staging in run 40744557017. Its separate General checkouts only installed dependencies, so they skipped cases that inspect the daemon before collection. The separately prepared Native lane's four files do not cover these six cases.

| General file | Missing cases | Required fixture | Baseline classification |
| --- | ---: | --- | --- |
| `runner-tool-results-prp.integration.test.ts` | 1 | Staged Runner daemon | Build fixture regression |
| `case-handoff-native.integration.test.ts` | 1 | Staged daemon and supported embedded PostgreSQL | Build fixture regression |
| `runner-api.integration.test.ts` | 2 | Staged daemon, current and legacy HTTP receipt variants | Build fixture regression |
| `native-session-resume.test.ts` | 2 | Staged daemon; its fake provider is a versioned JS fixture | Build fixture regression |
| `paperclip-runner-real-server.integration.test.ts` | 1 | Staged daemon and debug `fake-codex-app-server` | Preexisting gap: normal build and Native beforeAll only build release binaries |

The six daemon-only cases would pass their collection gates after the original same-checkout build on this supported Linux host; this does not prove their assertions passed in the cancelled baseline run. The debug-provider case is an additional local process qualification that this correction can legitimately execute, not a claimed baseline regression. All seven still need actual execution on the corrected Linux CI head.

## Workflow

[getter-control.yml](../../../.github/workflows/getter-control.yml) retains launcher checks, full build, workspace typecheck and token checks in source. It adds the actual test-plan guard. Each of 29 test lanes depends on successful source checks, checks out the same event revision and installs the frozen lockfile independently. No compiled workspace artifact is transferred from a different checkout.

The matrix uses explicit groups from the unchanged runner:

| Group | Jobs | Selection |
| --- | ---: | --- |
| General server without chat or native Runner | 12 | Indices 0 through 11; count 12 |
| Chat | 3 | Indices 0 through 2; count 3; embedded mode expands to six worker indices |
| Native Runner | 1 | Unsharded |
| UI and CLI, workspace A | 2 | Indices 0 and 1; count 2 |
| Other packages, workspace B | 1 | Unsharded, 17 projects |
| Database, workspace C | 1 | Unsharded |
| Serialized server | 9 | Indices 0 through 8; count 9 |

The explicit server group is general-server-without-chat-or-native-runner. It does not depend on GITHUB_WORKFLOW being named PR. The native group is included separately; no environment value is forged to omit those tests. Workspace B does not contain the paperclip-runner project, which is absent from the root Vitest project list.

All jobs retain Node 26.12.1 and pnpm 9.15.4. Source and lanes requiring process fixtures select Rust from the existing rust-toolchain.toml, currently 1.97.1, with CARGO_BUILD_JOBS=2. An early step creates a home below RUNNER_TEMP and writes both home aliases to GITHUB_ENV before workspace setup. Each test lane uses its matrix id in the home name. Telemetry, announcements and update checks remain disabled. The workflow does not declare an external test database, model connection or customer data.

The application resolver prefers GETTER_CONTROL_HOME over PAPERCLIP_HOME. The unchanged stable runner and server test setup narrow PAPERCLIP_HOME per invocation and worker; older tests also override that alias. Inheriting a job-wide Getter alias would defeat those narrower homes. The lane execution owner removes GETTER_CONTROL_HOME only from the child environment before starting the official pnpm wrapper. PAPERCLIP_HOME remains available for the runner's host check, then its existing invocation/worker overrides take effect. Build and preparation steps retain the paired job home. This correction changes test execution isolation; it does not change the application resolver or establish the cause of every earlier Windows failure.

The native lane prepares TypeScript, all debug bins, release paperclip-runnerd and fake-codex-app-server, then stages the daemon. Executable checks occur before collection. This matters because native process tests inspect the debug fake server before registering their cases; its absence would cause it.skip. Cargo inputs and target outputs may be cached by OS, architecture, toolchain and Rust source hashes, but Cargo build and staging still execute on the checked-out sources.

Every lane first resolves process requirements from the official dry-run's actual `selectedGeneralServerSuites`, after validating the supplied JSON against the workflow matrix. An explicit five-file inventory identifies the seven General process cases. Current assignments are server-02, server-03, server-05, server-07 and server-10; these ids are evidence, not execution conditions. If the runner assigns a file to another shard, its selected-file output moves preparation with it. Only selected General lanes build Runner TypeScript and `build:binary`, which performs staging; only the real-server owner additionally compiles the debug fake provider. Native preparation remains complete and unchanged. Executable checks run in each preparation step and again immediately before the official test wrapper.

The resolver writes daemon/debug outputs to `GITHUB_OUTPUT` and a scoped `<lane>-fixtures.json` record containing the checked lane, selected process files and event SHA. Before execution, the owner recomputes requirements from the current selection and compares that record, then checks the required executables. A missing binary, changed source or altered selection fails before the child starts. Rust/cache conditions include those derived requirements. The implementation adds no matrix fields, file exclusions, new shard groups or modifications to the stable runner.

Failure in one lane does not cancel siblings. The matrix limits concurrent jobs to 12. Source and test jobs upload only `.ci-test-logs/`, with `include-hidden-files=true`, `if-no-files-found=error` and an always-run condition. The guard requires those fields for both uploads, including failure propagation and the scoped path. Run 40744557017 proves actual artifact creation for all jobs; a new head must prove delivery again. Explicit Bash uses errexit and pipefail for piped checks. The Node lane wrapper records the actual exit code and signal; it does not turn a failed command into a passing tee.

## Guard and proof

[check-getter-control-test-plan.mjs](../../../scripts/check-getter-control-test-plan.mjs) reads the actual workflow matrix. Its run-lane mode consumes that same matrix through an environment JSON value, validates the fields and constructs pnpm arguments without shell interpolation or unchecked exclusions. The command in the workflow must use this checked execution path.

The guard invokes the original stable runner with dry-run and reads its JSON:

- The general server baseline is the complete general-server group, index 0 of count 1.
- The twelve ordinary server shards, the native files and the chat file must form precisely that set with no duplicate assignments.
- The nine serialized shards must equal the complete serialized baseline and remain disjoint from general server.
- Workspace A must cover all its Vitest slices. A, B and C must equal the project names resolved from the root Vitest configuration and package metadata.
- Chat worker indices must form a complete, unique range. The runner verifies actual collected case filters during execution.

Dry-run exposes chat indices but not the chat file path. The guard reads the literal chatSuite declaration from the same runner and fails if that declaration becomes unsupported. The runner is not patched or evaluated with replaced variables.

The current guard output confirms a planned union of 1,207 general server files, 162 serialized server files, 20 workspace projects and chat indices 0 through 5. This is a selection result, not a test execution result.

Seventeen Node regression tests use the real workflow and runner. The original twelve checks still reject missing Native preparation, incomplete selections, unsafe commands, ignored failures, shared databases, broken homes and artifact losses. They retain actual home-resolver subprocesses, exit 0/42 evidence, stderr, startup failures and unsafe CLI rejection. Five additional regressions reject missing or late General preparation, Native-only gates, absent executable checks, forged resolver lanes and missing Rust coverage. Actual selected-file tests confirm the current assignments and a remapping to another shard. Real CLI subprocesses write boolean outputs and same-source selection records. An isolated real child cannot start with absent daemon/provider files or altered source/selection records; providing its checked fixtures permits execution and preserves its log. These tool-only tests do not run real Runner, model or customer integrations.

## Conditional coverage ledger

Run 40744557017 has 98 actually unexecuted conditional cases, excluding Chat's intentional per-worker filters. None are counted as executed passes.

| Group | Cases | Gate and interpretation |
| --- | ---: | --- |
| General daemon cases | 6 | Missing staged Runner: fixture regression addressed here; Linux execution pending |
| General debug-provider case | 1 | Missing debug fake Codex: preexisting local fixture gap addressed here; Linux execution pending |
| General warm-transition restart | 35 | Both `PAPERCLIP_WARM_TRANSITION_FIXTURE_DIRECTORY` and a migrated `PAPERCLIP_TEST_DATABASE_URL`; explicit captured-fixture qualification, unchanged baseline opt-in |
| General bridge sandbox | 7 | Six require `/usr/bin/bwrap`; one tests unsupported non-Linux behavior. No platform security configuration is changed |
| General optional SDKs | 18 | Sentry 5 + 11 and OpenTelemetry 2; optional peers absent after the locked install |
| General platform cases | 4 | Three Darwin path-alias cases and one Windows adapter case on Linux |
| General benchmarks | 2 | `SEARCH_EVAL_SCALE=1` and `PORTABILITY_IMPORT_BENCH=1` |
| General live/cross-repository qualification | 8 | Export/resume 2, 1Password 1, HTTPS broker 1, live tool results 1, provider recovery 2, sibling inspection Cloud 1; explicit flags, credentials, socket or sibling dist required |
| Native remote continuity | 5 | `PAPERCLIP_TEST_RUNNER_CONTAINER`, five warm/hard/legacy/changed/same-server scenarios; unchanged opt-in |
| Packages sandbox | 5 | Four `PAPERCLIP_TEST_BWRAP` qualifications, including one also requiring `PAPERCLIP_TEST_SANDBOX_BUILD`; one non-Linux case |
| Packages Claude characterization | 1 | `RUN_CLAUDE_SETUP_TOKEN_CHARACTERIZATION=1`; explicit live CLI qualification |
| Packages Daytona duplex | 6 | Nonempty `DAYTONA_API_KEY`; external provider qualification |

General totals 81, Native 5 and Packages 12. The 35 captured warm cases are not covered by the 115 executed Native cases. No credentials, external migrated database, warm-fixture capture, container target, Bubblewrap installation or platform-security changes are introduced to force optional cases into this CI run.

## Acceptance limits

The updated guard and all 17 regressions passed locally on the pinned Node runtime, with no skips. Actionlint 1.7.12 returned exit 0 for the updated workflow, with optional Shellcheck and Pyflakes invocations disabled. Its official Windows release archive was verified against the published SHA-256 digest before execution. The actual dry-run still covers 29 lanes, 1,207 General files, 162 serialized files and 20 projects. Tool evidence is `calm-ci-process-fixtures-tests.log`, `calm-ci-process-fixtures-actionlint.log` and `calm-ci-process-fixtures-plan.json` under the task tools runtime. These checks do not execute the seven Linux process cases or establish full CI acceptance.

A new CI run on the corrected head must execute all 29 lanes, the seven General process cases and the previously unexecuted CLI second slice, preserve all artifacts and resolve the three UI failures. A failed lane remains failed; a group that aborts at an earlier project leaves later projects unexecuted. Preserve run 40744557017, its 30 verified artifacts and 98 conditional cases, along with the invalid first workflow, missing artifacts, earlier partial CI failures, Windows failures, WSL interruption and baseline cancellation. The observer's complete evidence is `calm-ci-40744557017-observations.json` in the task tools runtime. This workflow is neither production activation nor evidence that all CALM pages are complete.
