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
