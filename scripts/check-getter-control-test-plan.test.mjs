import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createRunnerPlanner,
  executeTestLane,
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
