# Getter Control full test verification

2026-10-28. This is CI support for the CALM shell PR. It does not change application code, test selection, numerical queries, production flags or the stable test runner.

## Problem and scope

The original Getter Control source job ran the full Vitest sequence after build and typecheck. The baseline workflow run 40637366842 had successful build and typecheck steps, then a cancelled unit/integration step after about 90 minutes. The cause of cancellation remains unconfirmed. The monolithic server defaults to one worker; the official sharded entry point permits two isolated files per worker host where no shared test database is configured.

The Windows baseline also failed before collection because its command exceeded the shell limit. A direct-Node run reached the chat integration suite and reported 815 failures among 1,586 cases; the cause remains unknown. The isolated WSL verification installed the locked dependencies and passed five launcher tests, then the distribution ended during build and subsequent entry attempts returned E_FAIL. These are unresolved verification failures. A passing selection guard does not replace them with a passing full suite.

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

All jobs retain Node 26.12.1 and pnpm 9.15.4. Source and native jobs select Rust from the existing rust-toolchain.toml, currently 1.97.1, with CARGO_BUILD_JOBS=2. Homes point to runner.temp. Telemetry, announcements and update checks remain disabled. The workflow does not declare an external test database, model connection or customer data.

The native lane prepares TypeScript, all debug bins, release paperclip-runnerd and fake-codex-app-server, then stages the daemon. Executable checks occur before collection. This matters because native process tests inspect the debug fake server before registering their cases; its absence would cause it.skip. Cargo inputs and target outputs may be cached by OS, architecture, toolchain and Rust source hashes, but Cargo build and staging still execute on the checked-out sources.

Failure in one lane does not cancel siblings. The matrix limits concurrent jobs to 12. It preserves source, preparation and test logs with always-run artifact upload. Explicit Bash uses errexit and pipefail for piped checks. The Node lane wrapper records the actual exit code and signal; it does not turn a failed command into a passing tee.

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

Seven Node regression tests use the real workflow and runner. They reject missing native preparation, missing or duplicate shards, omitted package groups or UI slices, a disconnected execution command, extra selection fields, ignored failures, a shared database, unsafe log ids and unsupported shard arguments.

## Acceptance limits

The guard and its regressions passed locally on the pinned Node runtime. YAML parsing and JavaScript syntax checks passed. The actual 29 CI lanes, native fixture builds and their full test results have not yet run as part of this change.

The first CI run must establish those results. A failed lane remains failed; a group that aborts at an earlier project leaves later projects unexecuted. Preserve the Windows failures, WSL interruption and baseline cancellation until their causes are explained or the discriminating verification is complete. This workflow is neither production activation nor evidence that all CALM pages are complete.
