# Getter Control

Getter Control is an independent [Paperclip](https://github.com/paperclipai/paperclip) fork for managing teams of AI agents. It retains companies, organization charts, goals, tasks, routines, approvals, budgets and activity history, with a Getter identity and its own local data.

Source: **[samir-getter/getter-control](https://github.com/samir-getter/getter-control)**. Initial upstream snapshot: `6cc765bd814f6f6c422fc5cae9933cdf04a49457` (Paperclip 0.3.1 workspace).

## Run from source

Requires Node **24.11.0 or newer** and **pnpm 9.15.4**. This checkout provides the source distribution; a Getter npm package, desktop installer and managed auto-update channel have not been released.

```sh
git clone https://github.com/samir-getter/getter-control.git
cd getter-control
pnpm install --frozen-lockfile
pnpm getter-control:prepare
pnpm getter-control
```

Open **http://127.0.0.1:3120**. First startup initializes an embedded PostgreSQL database in `.getter-control/instances/gettercontrol`. The app starts without companies or agents; use the interface to create your company and configure your agents.

On Windows, after preparing the workspace, `./Start-Getter-Control.ps1` starts the source app. In this Getter workspace it reuses the local Node runtime; elsewhere it uses Node on PATH. `-Prepare`, `-DataDir` and `-Port` are available. It restores its temporary PATH change when it exits.

```sh
pnpm getter-control --home /absolute/path/getter-control-data --port 3121
pnpm getter-control --check
pnpm getter-control:cli --help
```

`GETTER_CONTROL_HOME` selects the source launcher's home. The launcher sets its own config/context paths, uses loopback, and starts with product telemetry, upstream announcements and upstream update checks disabled. It does not import another instance's database, cloud configuration or provider environment keys. Set up providers in this instance's UI/configuration.

Windows x64 can run the source control plane using the TypeScript preparation command above. Native Runner qualification is currently Linux/macOS; a working Windows control plane does not establish native agent execution support. Full monorepo builds also require the pinned Rust toolchain and POSIX build utilities.

## Development and provenance

- [Getter Control guide](doc/GETTER-CONTROL.md): paths, startup, verification and platform limits.
- [Global skills and company synchronization](doc/GETTER-CONTROL-SKILLS.md): Hallmark, pinned packages, default installation and agent selection.
- [Original Paperclip README](README.paperclip.md): upstream capabilities and documentation. Its Paperclip installation commands refer to upstream, not to this fork.
- Existing `AGENTS.md`, `rules/`, `DESIGN.md` and architecture documents remain applicable.
- The upstream workflows are retained in `.github/upstream-workflows/`; Getter CI uses GitHub hosted runners and does not publish upstream packages or containers.

Internal package names (`@paperclipai/*`), API routes, adapter contracts and `.paperclip.yaml` stay compatible with Paperclip. Getter Control currently runs independently of Getter Code, Getter Tots and Jarvis Industrial.

Licensed under [MIT](LICENSE). Original Paperclip copyright and third-party notices are preserved.
