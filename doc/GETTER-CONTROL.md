# Getter Control source distribution

This is an independent fork of Paperclip at upstream commit `6cc765bd814f6f6c422fc5cae9933cdf04a49457`, preserving the MIT license, third-party notices and company/agent governance contracts. Its GitHub repository is https://github.com/samir-getter/getter-control. `origin` is the Getter fork; `upstream` is Paperclip.

## Local startup

Use Node >=24.11.0 and pnpm 9.15.4:

```sh
pnpm install --frozen-lockfile
pnpm getter-control:prepare
pnpm getter-control
```

The preparation command runs workspace link checks, the official Runner TypeScript build (including protocol/provider checks), and the official Plugin SDK build-dependency helper. It does not build the Rust Runner binary. Git checkout uses LF for text to preserve generated-file comparisons and pinned patch hashes on Windows.

The source launcher uses `http://127.0.0.1:3120`, instance `gettercontrol`, PostgreSQL's preferred port `54349`, and a repository-local `.getter-control` home. `--db-port` sets the preferred port in a newly created config; existing configs retain their DB port. The PostgreSQL supervisor can choose another free DB port when necessary. Options:

```sh
pnpm getter-control --home /absolute/path/control-data --port 3121 --db-port 54350
pnpm getter-control --check
pnpm getter-control:cli --help
```

`--check` checks the source prerequisites and reports paths without creating an instance. First actual startup creates config, independent local JWT/tool-action signing secrets, embedded PostgreSQL and migrations. Existing signing material is preserved using the upstream atomic env-file helpers. Stop the foreground launcher with Ctrl+C; its IPC channel asks the server to shut down PostgreSQL and app services in order, including on Windows.

## Independent state

| State | Default source location |
| --- | --- |
| Config | `.getter-control/instances/gettercontrol/config.json` |
| CLI context/auth | `.getter-control/context.json`, `.getter-control/auth.json` |
| Database | `.getter-control/instances/gettercontrol/db/` |
| Logs | `.getter-control/instances/gettercontrol/logs/` |
| Uploads | `.getter-control/instances/gettercontrol/data/storage/` |
| Backups | `.getter-control/instances/gettercontrol/data/backups/` |
| Local encryption key | `.getter-control/instances/gettercontrol/secrets/master.key` |

Set `GETTER_CONTROL_HOME` or `--home` to select a different source home. Direct internal CLI/server consumers default to `~/.getter-control`, with an explicit `PAPERCLIP_HOME` supported as a compatibility alias. An explicit data-dir argument updates both aliases. Config discovery looks for `.getter-control/config.json`, and explicit `PAPERCLIP_CONFIG` remains supported internally.

The Getter launcher sets absolute config/context paths and disables the checkout `.env`. It carries OS essentials into its child process and excludes inherited database URLs, signing keys, provider keys, cloud configuration, telemetry exporters and other instance overrides. Its new config sets telemetry and update checks off; upstream announcements are disabled by environment. Optional provider configuration belongs to this instance's UI/configuration. The launcher does not create a company/CEO, install a system service or import another Getter application's state.

`local_trusted` grants local board authority, so this distribution binds to loopback. Use the existing authenticated deployment configuration for a separately designed remote deployment.

## Distribution and CI

There is no Getter npm package, installer or automatic binary update channel yet. All managed installation, payload updates, rollback, uninstall and system service entry points are guarded because the upstream shim/service names are not a separate Getter distribution. Source updates remain manual in this checkout. Original helpers and package namespaces are retained for compatibility and future packaging.

The UI presents Getter Control in document titles, PWA metadata, authentication and bootstrap/error screens. Internal `@paperclipai/*`, REST `/api`, adapter identifiers and `.paperclip.yaml` remain unchanged. Paperclip Cloud names refer to that optional upstream service, not to a Getter cloud deployment.

Original GitHub workflows are archived in `.github/upstream-workflows/` so the fork does not execute upstream release, cloud deployment or private AWS runner jobs. `.github/workflows/getter-control.yml` defines source verification on GitHub hosted Ubuntu. It performs builds, typechecks, tests and design token checks; it publishes no package or container.

## Platform and verification limits

Windows x64 has an embedded PostgreSQL package and can prepare the TypeScript control plane without Rust. Native Paperclip Runner qualification currently covers Linux/macOS. A UI/API startup does not prove real provider execution, native Windows agents, desktop packaging or paid integrations.

Full monorepo build/typecheck includes the pinned Rust toolchain in `packages/paperclip-runner/rust-toolchain.toml`, and some package scripts use POSIX tools. Windows may require Git Bash and Visual Studio C++ build tooling. Optional `cpu-features` and SSH crypto native bindings failed to compile on this machine because Visual Studio C++ tooling was absent; the workspace installer completed successfully with fallbacks.

Source unit/integration checks and a local API/UI proof do not qualify an npm release or native Runner. The unchanged Windows reference initially failed token gates and generated palette/cliplab checks because CRLF checkout changed the input fingerprints. Getter's LF checkout policy resolved that failure: 33 allowlist entries load, 106 existing issues are correctly allowlisted, all four design gates are clean, and generated palette/cliplab checks pass.

Full Windows checks were attempted separately: the default command shell rejects POSIX package scripts; Git Bash gets further, but the full build encounters an upstream Windows ESM absolute-path import, and the complete stable test runner exceeds Windows command-line limits. These failures do not become a passing full suite merely because focused tests or source startup succeed. Hosted Ubuntu CI retains the complete checks.
