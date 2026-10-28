import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createRunnerPlanner,
  executePreparedTestLane,
  executeTestLane,
  processFixtureRequirements,
  readTestWorkflow,
  runnerArguments,
  verifyTestPlan,
  workflowLanes,
} from "./check-getter-control-test-plan.mjs";

const original = readTestWorkflow();
const plan = createRunnerPlanner();
const copy = () => structuredClone(original);
const matrix = (workflow) => workflow.jobs.tests.strategy.matrix.include;

test("the real workflow covers the complete unchanged stable runner and root project config", () => {
  const report = verifyTestPlan(original, plan);
  assert.equal(report.lanes, 29);
  assert.ok(report.generalServerFiles > 1200);
  assert.ok(report.serializedServerFiles > 150);
  assert.deepEqual(report.chatWorkers, [0, 1, 2, 3, 4, 5]);
  assert.equal(report.kind, "Planned test selection; not execution");
});

test("omitting the native lane cannot produce a complete plan or silently skip process cases", () => {
  const workflow = copy();
  workflow.jobs.tests.strategy.matrix.include = matrix(workflow).filter((lane) => !lane.native);
  assert.throws(() => verifyTestPlan(workflow, plan), /Missing group: general-server-native-runner/);
});

test("a missing server shard and a duplicate serialized shard are rejected", () => {
  const missing = copy();
  matrix(missing).splice(matrix(missing).findIndex((lane) => lane.id === "server-02"), 1);
  assert.throws(() => verifyTestPlan(missing, plan), /Missing or duplicate shard indices/);
  const duplicate = copy();
  const first = matrix(duplicate).find((lane) => lane.id === "serial-01");
  matrix(duplicate).push({ ...first, id: "duplicate-serial" });
  assert.throws(() => verifyTestPlan(duplicate, plan), /Missing or duplicate shard indices/);
});

test("every configured workspace group and UI/CLI slice must remain scheduled", () => {
  const packages = copy();
  packages.jobs.tests.strategy.matrix.include = matrix(packages).filter((lane) => lane.id !== "packages");
  assert.throws(() => verifyTestPlan(packages, plan), /Missing group: general-workspaces-b/);
  const ui = copy();
  ui.jobs.tests.strategy.matrix.include = matrix(ui).filter((lane) => lane.id !== "ui-cli-02");
  assert.throws(() => verifyTestPlan(ui, plan), /Missing or duplicate shard indices/);
});

test("the executing command must consume exactly the checked matrix", () => {
  const workflow = copy();
  workflow.jobs.tests.steps.find((step) => step.name === "Run checked test lane").run = "pnpm exec vitest run --project @paperclipai/ui";
  assert.throws(() => workflowLanes(workflow), /Tests must execute the checked lane arguments/);
  const extra = copy();
  matrix(extra)[0].exclude = "server/src/**";
  assert.throws(() => workflowLanes(extra), /Test lanes must use only the checked fields/);
});

test("native preparation, sibling failure results and database isolation cannot be bypassed", () => {
  const native = copy();
  matrix(native).find((lane) => lane.native).native = false;
  assert.throws(() => workflowLanes(native), /Native process preparation must match/);
  const debug = copy();
  const prepare = debug.jobs.tests.steps.find((step) => step.name === "Prepare native process fixtures before collection");
  prepare.run = prepare.run.replace("pnpm --filter @paperclipai/paperclip-runner build:rust", "");
  assert.throws(() => workflowLanes(debug), /Missing native prerequisite/);
  const cancel = copy();
  cancel.jobs.tests.strategy["fail-fast"] = true;
  assert.throws(() => workflowLanes(cancel), /One failure must not cancel/);
  const pipe = copy();
  pipe.defaults.run.shell = "sh";
  assert.throws(() => workflowLanes(pipe), /Bash pipefail shell/);
  const sharedDatabase = copy();
  sharedDatabase.jobs.tests.env = { PAPERCLIP_TEST_DATABASE_URL: "postgres://test-only.invalid/shared" };
  assert.throws(() => workflowLanes(sharedDatabase), /isolated embedded test databases/);
});

test("unsafe ids and arguments for unsupported unsharded groups fail before execution", () => {
  const unsafe = copy();
  matrix(unsafe)[0].id = "../outside";
  assert.throws(() => workflowLanes(unsafe), /safe log filename/);
  const native = matrix(original).find((lane) => lane.native);
  const nativePlan = plan(runnerArguments(native));
  assert.ok(nativePlan.selectedGeneralServerSuites.length > 0);
  assert.throws(() => runnerArguments({ ...native, shardCount: 2 }), /cannot be sharded/);
});

test("application homes initialize before setup through a supported step context", () => {
  const missing = copy();
  missing.jobs.tests.steps = missing.jobs.tests.steps.filter((step) => step.name !== "Initialize isolated application home");
  assert.throws(() => workflowLanes(missing), /Initialize an isolated home before/);
  const jobContext = copy();
  jobContext.jobs.source.env = { GETTER_CONTROL_HOME: "${{ runner.temp }}/source" };
  assert.throws(() => workflowLanes(jobContext), /step, not job-level env/);
  const aliases = copy();
  const initialize = aliases.jobs.tests.steps.find((step) => step.name === "Initialize isolated application home");
  initialize.run = initialize.run.replace("PAPERCLIP_HOME=%s", "UNUSED_HOME=%s");
  assert.throws(() => workflowLanes(aliases), /Both home aliases must share/);
});

test("both uploads retain hidden logs and reject absent logs or skipped evidence", () => {
  for (const jobName of ["source", "tests"]) {
    for (const [field, value, message] of [
      ["include-hidden-files", undefined, /include the hidden log directory/],
      ["include-hidden-files", false, /include the hidden log directory/],
      ["if-no-files-found", undefined, /Missing check logs must fail/],
      ["if-no-files-found", "warn", /Missing check logs must fail/],
      ["if-no-files-found", "ignore", /Missing check logs must fail/],
      ["path", ".", /stay scoped to the check log directory/],
    ]) {
      const workflow = copy();
      const upload = workflow.jobs[jobName].steps.find((step) => step.uses === "actions/upload-artifact@v4");
      if (value === undefined) delete upload.with[field];
      else upload.with[field] = value;
      assert.throws(() => workflowLanes(workflow), message);
    }
    const skipped = copy();
    skipped.jobs[jobName].steps.find((step) => step.uses === "actions/upload-artifact@v4").if = "success()";
    assert.throws(() => workflowLanes(skipped), /run on success or failure/);
    const ignored = copy();
    ignored.jobs[jobName].steps.find((step) => step.uses === "actions/upload-artifact@v4")["continue-on-error"] = true;
    assert.throws(() => workflowLanes(ignored), /Artifact upload failure must fail/);
  }
});

test("selected General process preparation cannot be omitted, delayed or gated by native membership", () => {
  for (const name of ["Prepare selected General Runner daemon before collection", "Prepare selected General debug provider before collection"]) {
    const missing = copy();
    missing.jobs.tests.steps = missing.jobs.tests.steps.filter((step) => step.name !== name);
    assert.throws(() => workflowLanes(missing), /General process prerequisites must precede collection/);
    const late = copy();
    const index = late.jobs.tests.steps.findIndex((step) => step.name === name);
    late.jobs.tests.steps.push(late.jobs.tests.steps.splice(index, 1)[0]);
    assert.throws(() => workflowLanes(late), /General process prerequisites must precede collection/);
    const nativeOnly = copy();
    nativeOnly.jobs.tests.steps.find((step) => step.name === name).if = "matrix.native";
    assert.throws(() => workflowLanes(nativeOnly), /follow selected process requirements/);
    const noCheck = copy();
    const step = noCheck.jobs.tests.steps.find((candidate) => candidate.name === name);
    step.run = step.run.split("\n").filter((line) => !line.includes("test -x")).join("\n");
    assert.throws(() => workflowLanes(noCheck), /Missing General process prerequisite/);
  }
  const noBinary = copy();
  const daemon = noBinary.jobs.tests.steps.find((step) => step.name === "Prepare selected General Runner daemon before collection");
  daemon.run = daemon.run.replace("build:binary", "build:typescript");
  assert.throws(() => workflowLanes(noBinary), /Missing General process prerequisite/);
});

test("fixture resolution and Rust setup consume the checked matrix before preparation", () => {
  const missing = copy();
  missing.jobs.tests.steps = missing.jobs.tests.steps.filter((step) => step.name !== "Resolve selected process fixture requirements");
  assert.throws(() => workflowLanes(missing), /checked outputs/);
  const forged = copy();
  forged.jobs.tests.steps.find((step) => step.id === "process_fixtures").env.GETTER_CONTROL_TEST_LANE = '{"id":"server-02"}';
  assert.throws(() => workflowLanes(forged), /consume the actual matrix/);
  const late = copy();
  const index = late.jobs.tests.steps.findIndex((step) => step.id === "process_fixtures");
  late.jobs.tests.steps.push(late.jobs.tests.steps.splice(index, 1)[0]);
  assert.throws(() => workflowLanes(late), /before Rust setup and cache/);
  for (const name of ["Select pinned Rust toolchain", "Cache native build inputs"]) {
    const nativeOnly = copy();
    nativeOnly.jobs.tests.steps.find((step) => step.name === name).if = "matrix.native";
    assert.throws(() => workflowLanes(nativeOnly), /include selected General process suites/);
  }
});

test("real selected files determine process fixture lanes and survive shard remapping", () => {
  const report = verifyTestPlan(original, plan);
  const general = report.processFixtureLanes.filter((requirements) => !requirements.lane.native);
  assert.deepEqual(general.map((requirements) => requirements.lane.id), ["server-02", "server-03", "server-05", "server-07", "server-10"]);
  assert.deepEqual(general.filter((requirements) => requirements.debugProvider).map((requirements) => requirements.lane.id), ["server-10"]);
  const first = matrix(original).find((lane) => lane.id === "server-01");
  const movedFile = "server/src/services/native-runtime/paperclip-runner-real-server.integration.test.ts";
  assert.equal(processFixtureRequirements(first, plan).daemon, false);
  const remapped = (args) => ({ ...plan(args), selectedGeneralServerSuites: [movedFile] });
  const moved = processFixtureRequirements(first, remapped, "fixture-sha");
  assert.equal(moved.daemon, true);
  assert.equal(moved.debugProvider, true);
  assert.deepEqual(moved.suites, [movedFile]);
  assert.equal(moved.sourceSha, "fixture-sha");
  assert.equal(processFixtureRequirements(first, () => ({ selectedGeneralServerSuites: [] })).daemon, false);
  for (const id of ["ui-cli-01", "chat-01", "serial-01", "database", "packages"]) {
    assert.equal(processFixtureRequirements(matrix(original).find((lane) => lane.id === id), plan).daemon, false);
  }
});

function temporaryFixture(t) {
  const parent = realpathSync(os.tmpdir());
  const folder = realpathSync(mkdtempSync(path.join(parent, "getter-calm-ci-")));
  t.after(() => {
    assert.ok(folder.startsWith(parent + path.sep + "getter-calm-ci-"));
    rmSync(folder, { recursive: true, force: true });
  });
  return folder;
}

test("real child processes keep worker and test home overrides and preserve pass and failure evidence", async (t) => {
  const folder = temporaryFixture(t);
  const fixture = path.join(folder, "child.mjs");
  const homeModule = new URL("../packages/shared/src/home-paths.ts", import.meta.url).href;
  writeFileSync(fixture, `
import { resolvePaperclipHomeDir } from ${JSON.stringify(homeModule)};
const workerHome = resolvePaperclipHomeDir();
const getterAlias = process.env.GETTER_CONTROL_HOME ?? null;
process.env.PAPERCLIP_HOME = process.env.TEST_CASE_HOME;
console.log(JSON.stringify({ getterAlias, workerHome, caseHome: resolvePaperclipHomeDir() }));
console.error("fixture stderr retained");
process.exit(Number(process.env.TEST_CASE_EXIT));
`);
  for (const exitCode of [0, 42]) {
    const lane = matrix(original).find((candidate) => candidate.id === "server-01");
    const environment = {
      ...process.env,
      GETTER_CONTROL_HOME: path.join(folder, "job"),
      PAPERCLIP_HOME: path.join(folder, "worker"),
      TEST_CASE_HOME: path.join(folder, "case"),
      TEST_CASE_EXIT: String(exitCode),
    };
    delete environment.PAPERCLIP_TEST_DATABASE_URL;
    const logDir = path.join(folder, "logs-" + exitCode);
    const result = await executeTestLane(lane, {
      cwd: folder, logDir, environment,
      executable: process.execPath, executableArguments: [fixture],
    });
    assert.equal(result.exitCode, exitCode);
    assert.equal(result.signal, null);
    assert.equal(result.failure, undefined);
    const log = readFileSync(path.join(logDir, lane.id + ".log"), "utf8");
    const observed = JSON.parse(log.split("\n").find((line) => line.startsWith("{")));
    assert.deepEqual(observed, {
      getterAlias: null, workerHome: environment.PAPERCLIP_HOME,
      caseHome: environment.TEST_CASE_HOME,
    });
    assert.match(log, /fixture stderr retained/);
    const saved = JSON.parse(readFileSync(path.join(logDir, lane.id + ".json"), "utf8"));
    assert.equal(saved.exitCode, exitCode);
    assert.deepEqual(saved.command, [process.execPath, fixture, "test:run:general", "--", "--group", lane.group, "--shard-index", "0", "--shard-count", "12"]);
    assert.equal(environment.GETTER_CONTROL_HOME, path.join(folder, "job"));
  }
});

test("a command that cannot start records a real failure", async (t) => {
  const folder = temporaryFixture(t);
  const lane = matrix(original)[0];
  const environment = { ...process.env };
  delete environment.PAPERCLIP_TEST_DATABASE_URL;
  const result = await executeTestLane(lane, {
    cwd: folder, logDir: folder, environment, executable: path.join(folder, "missing-test-command"),
  });
  assert.equal(result.exitCode, 1);
  assert.match(result.failure, /ENOENT/);
  const saved = JSON.parse(readFileSync(path.join(folder, lane.id + ".json"), "utf8"));
  assert.equal(saved.exitCode, 1);
  assert.match(readFileSync(path.join(folder, lane.id + ".log"), "utf8"), /Could not execute test command/);
});

test("the actual CLI rejects a caller-supplied lane before spawning tests", () => {
  const environment = {
    ...process.env,
    GETTER_CONTROL_TEST_LANE: JSON.stringify({ ...matrix(original)[0], id: "../untrusted" }),
  };
  delete environment.PAPERCLIP_TEST_DATABASE_URL;
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("./check-getter-control-test-plan.mjs", import.meta.url)), "--run-lane"], {
    encoding: "utf8", env: environment,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /safe log filename/);
  assert.doesNotMatch(result.stdout, /\[getter-tests\] pnpm/);
});

test("the actual fixture CLI writes outputs and a same-source selected-suite record, rejecting forged lanes", (t) => {
  const folder = temporaryFixture(t);
  const script = fileURLToPath(new URL("./check-getter-control-test-plan.mjs", import.meta.url));
  const repo = fileURLToPath(new URL("../", import.meta.url));
  for (const [id, daemon, debug] of [["server-01", false, false], ["server-07", true, false], ["server-10", true, true], ["native-runner", true, true]]) {
    const lane = matrix(original).find((candidate) => candidate.id === id);
    const record = path.join(repo, ".ci-test-logs", id + "-fixtures.json");
    const previous = existsSync(record) ? readFileSync(record) : null;
    t.after(() => { if (previous) writeFileSync(record, previous); else rmSync(record, { force: true }); });
    const output = path.join(folder, id + "-outputs");
    const environment = { ...process.env, GITHUB_SHA: "fixture-sha", GITHUB_OUTPUT: output, GETTER_CONTROL_TEST_LANE: JSON.stringify(lane) };
    delete environment.PAPERCLIP_TEST_DATABASE_URL;
    const result = spawnSync(process.execPath, [script, "--resolve-process-fixtures"], { encoding: "utf8", env: environment });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(output, "utf8"), "daemon=" + daemon + "\ndebug_provider=" + debug + "\n");
    const saved = JSON.parse(readFileSync(record, "utf8"));
    assert.deepEqual(saved, JSON.parse(result.stdout));
    assert.equal(saved.sourceSha, "fixture-sha");
    assert.deepEqual(saved.lane, lane);
  }
  const output = path.join(folder, "forged-outputs");
  const forged = { ...matrix(original)[0], shardIndex: 11 };
  const result = spawnSync(process.execPath, [script, "--resolve-process-fixtures"], {
    encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: output, GETTER_CONTROL_TEST_LANE: JSON.stringify(forged) },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must match the checked workflow matrix/);
  assert.equal(existsSync(output), false);
});

test("missing binaries and altered source records prevent a real child from starting; prepared binaries admit it", async (t) => {
  const folder = temporaryFixture(t);
  const lane = matrix(original).find((candidate) => candidate.id === "server-10");
  const child = path.join(folder, "child.mjs");
  const marker = path.join(folder, "started");
  writeFileSync(child, 'import { writeFileSync } from "node:fs"; writeFileSync(process.env.TEST_CHILD_MARKER, "started"); console.log("prepared child executed");');
  const environment = { ...process.env, GITHUB_SHA: "fixture-sha", TEST_CHILD_MARKER: marker };
  delete environment.PAPERCLIP_TEST_DATABASE_URL;
  const requirements = processFixtureRequirements(lane, plan, environment.GITHUB_SHA);
  const record = path.join(folder, lane.id + "-fixtures.json");
  writeFileSync(record, JSON.stringify(requirements));
  const execute = () => executePreparedTestLane(lane, {
    cwd: folder, logDir: folder, environment, planner: plan,
    executable: process.execPath, executableArguments: [child],
  });
  await assert.rejects(execute, /Missing executable process prerequisite/);
  assert.equal(existsSync(marker), false);
  const suffix = process.platform === "win32" ? ".exe" : "";
  const daemon = path.join(folder, "packages/paperclip-runner/dist/bin/paperclip-runnerd" + suffix);
  mkdirSync(path.dirname(daemon), { recursive: true });
  writeFileSync(daemon, "fixture daemon");
  chmodSync(daemon, 0o755);
  await assert.rejects(execute, /target.debug.fake-codex-app-server/);
  assert.equal(existsSync(marker), false);
  const provider = path.join(folder, "packages/paperclip-runner/runner/target/debug/fake-codex-app-server" + suffix);
  mkdirSync(path.dirname(provider), { recursive: true });
  writeFileSync(provider, "fixture provider");
  chmodSync(provider, 0o755);
  writeFileSync(record, JSON.stringify({ ...requirements, sourceSha: "other-source" }));
  await assert.rejects(execute, /match the current source and selected lane/);
  assert.equal(existsSync(marker), false);
  writeFileSync(record, JSON.stringify({ ...requirements, suites: [] }));
  await assert.rejects(execute, /match the current source and selected lane/);
  assert.equal(existsSync(marker), false);
  writeFileSync(record, JSON.stringify(requirements));
  const result = await execute();
  assert.equal(result.exitCode, 0);
  assert.equal(readFileSync(marker, "utf8"), "started");
  assert.match(readFileSync(path.join(folder, lane.id + ".log"), "utf8"), /prepared child executed/);
  const failedChecks = readFileSync(path.join(folder, lane.id + "-fixture-check.log"), "utf8");
  assert.match(failedChecks, /Missing executable process prerequisite.*dist.bin.paperclip-runnerd/);
  assert.match(failedChecks, /Missing executable process prerequisite.*target.debug.fake-codex-app-server/);
  assert.match(failedChecks, /match the current source and selected lane/);
});
