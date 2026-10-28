# Getter Control verification — 2026-10-28

Target: independent source fork based on Paperclip commit `6cc765bd814f6f6c422fc5cae9933cdf04a49457`, native Windows x64, Node 26.12.1 and pnpm 9.15.4. Tests used new embedded PostgreSQL data and loopback HTTP. No company, CEO, live agent, provider credential or system service was created for this verification.

## Verified locally

| Check | Result |
| --- | --- |
| Frozen workspace installation | Passed; optional CPU/SSH crypto compilation fell back without Visual Studio |
| Official Runner TypeScript preparation and Plugin SDK dependency build | Passed |
| Getter UI build | Passed |
| UI identity/component tests | 69 tests passed |
| Server favicon/Vite HTML regression tests | 11 tests passed |
| CLI managed-distribution/onboarding/update-notice guards | 39 tests passed |
| CLI source invocation hints | 40 tests passed |
| Launcher environment, state paths and real-process IPC regressions | 5 tests passed |
| Startup housekeeping/shutdown regressions | 4 focused cases passed; active failure evidence preserved |
| Direct Shared, CLI and Server TypeScript checks | Passed |
| Design token gates, agent palette and cliplab generated checks | Passed after LF checkout normalization |
| Real source API/UI smoke | HTTP 200 for health, companies, HTML and Getter SVG; companies empty |
| Independent signing material | JWT and tool-action secrets created in the selected instance's `.env` |
| Real ordered shutdown | PostgreSQL stopped, launcher exit code 0 |
| Restart with existing signing material | Passed; the selected instance's `.env` remained byte-identical |

The final API/UI/IPC proof used a new home at `D:/Gettet/tools/getter-control-runtime/smoke-data-zOGugL` and `http://127.0.0.1:3120`. The source launcher's own config specified that database location, disabled product telemetry and update checks, and retained loopback binding. Runtime evidence is local, including `smoke-final.log`, `tokens-lf.log`, `ui-build.log`, `ui-brand-tests.log`, `ui-runtime-brand-tests.log` and `source-hints-tests-final.log` in `D:/Gettet/tools/getter-control-runtime/`.

## Failures retained and resolved

The first Windows preparation failed because CRLF checkout changed immutable patch/generated-file fingerprints. The LF policy restored the intended bytes; official protocol/profile checks and all design gates then passed. No manifests, pin hashes or allowlists were weakened.

The first source smoke served the API/UI but timed out waiting for the launcher to exit. Quality review identified a referenced parent IPC channel and a readiness/disconnect race. The launcher/wrapper now release IPC, prioritize stop requests and handle closed-channel sends; two real-process regressions and the subsequent real PostgreSQL shutdown passed.

That shutdown also exposed a startup housekeeping race: the next maintenance step could register work after the coordinator stopped. The server now checks the scheduler stop flag before each new step, while awaiting active work and preserving its failures. A real restart with the existing signing material again passed API/UI checks and exited with code 0, with no late housekeeping error (`smoke-restart.log`).

The pre-fix regression recorded 26 worker registrations where shutdown required stopping at 25. All four focused housekeeping cases passed after the guard (`shutdown-race-repro.log`, `shutdown-housekeeping-pass.log`). Scope and code-quality reviews approved the final changes.

CLI verification also exposed a backup `fsync` failure on a read-only descriptor in Windows. Opening the existing backup with write access preserved durability and made its regression tests pass. A source invocation test still expected the upstream bootstrap command; it now verifies the Getter source command and all 40 tests pass.

## Complete monorepo checks remain unqualified on Windows

All three broad commands were attempted; focused success does not turn these attempts into a passing full suite:

- `pnpm -r typecheck`: the default Windows shell rejects POSIX package scripts. With Git Bash it gets through TypeScript but the Rust build requires the Microsoft C++ linker; the available `link.exe` was Git's POSIX utility, so Cargo link steps fail.
- `pnpm build`: Git Bash gets through several packages but encounters an upstream Windows absolute-path ESM import (`d:` URL scheme) in Runner protocol coverage generation.
- `pnpm test:run`: the stable runner exceeds Windows command-line length while excluding 162 serialized server suites.

The Getter GitHub hosted Ubuntu workflow retains full build, typecheck and test commands with the pinned Rust toolchain. Local API/UI proof does not establish a passing hosted CI run, native Windows agent support, provider execution, npm packaging or a desktop installer.

An expanded startup fixture run also encountered existing Windows backup failures involving directory `fsync` (`EPERM`) and dependent backup mocks. The complete startup fixture file is not claimed as passing; backup durability on Windows remains unqualified. The changed housekeeping behavior has separate focused regressions and a real startup/stop proof.

## Hallmark and company default verification

Hallmark 2.0.0 is pinned to `Nutlope/hallmark@6033bab2a8051b5454552d2e8e6cb8f27c483a42`. Its 165-file installation payload has content hash `sha256:7293b94d0fd31af3d39a5e2cf415fa5c95928e8a25b14853e807ebac84c12f16`. The official instruction body, license, agent metadata, helpers and theme previews are verified against immutable source hashes.

The catalog build, validation and TypeScript check passed, along with 22 focused catalog tests. The unchanged packaged-artifacts test failed with Windows `spawnSync npm ENOENT`; an independent invocation of the explicit local `npm-cli.js` produced and verified the real `.tgz`, including all 165 Hallmark files and equal generated/distributed manifests. The launcher isolation and IPC tests passed (5 tests).

The actual-package PostgreSQL integration passed with network fetch disabled. It verified every installed and immutable runtime file against the catalog SHA, scoped invalidation to the selected agent in the installing company, preserved agent settings, left another company untouched, and produced no new event on repeated default reconciliation. Both home aliases were isolated to a temporary test directory.

The final company-default and public catalog installation run passed **27/27 tests** (13 default/reconciliation cases and 14 public-install cases), with a passing server TypeScript check. PostgreSQL regressions verified both orders of manual/default installation, concurrent packages with different keys sharing operational inventory, policy denials, activity rollback/retry, and durable audit evidence after a rejected reinstall. All catalog writers now acquire the same company advisory lock before inventory preparation or shared file replacement. The final evidence is in `company-catalog-final-tests.log` and `company-defaults-typecheck.log`.

The real API proof used `http://127.0.0.1:3122` and independent home `D:/Gettet/tools/getter-control-runtime/hallmark-api-state-yiyLbE`. Two newly created companies automatically received Hallmark. Removing a default from one test company and restarting restored its missing installation while preserving the second company's existing skill ID. All 165 bytes inventories were checked, no agents or provider runs were created, and both owned server processes exited with code 0. Evidence is recorded in `hallmark-api-proof.json`, `hallmark-api-proof-final.log` and `hallmark-api-server.log` in the task runtime directory. Startup reconciliation follows asynchronous housekeeping, so the proof waited for completed installation separately from server readiness.

The first real package installation correctly failed on 50 JPG previews misclassified as text references. The catalog and server inventory classifiers now recognize these images as assets while preserving script precedence. No install audit rule was weakened. An earlier cold import/test budget and the first API startup deadline were exceeded on this Windows host; fixture loading was moved to setup and the final bounded API/IPC proof completed successfully. These failed attempts remain in the local logs.

The persistent source instance was then restarted at `http://127.0.0.1:3120` using its existing `.getter-control` home. Health returned `ok`, the global catalog exposed Hallmark with `defaultInstall: true` and 165 files, and the existing signing `.env` remained byte-identical. This instance has no companies yet; new companies receive the default during creation. The restart evidence is in `getter-control-running-hallmark.log`.
