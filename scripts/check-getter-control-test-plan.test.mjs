import assert from "node:assert/strict";
import test from "node:test";
import {
  createRunnerPlanner,
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
  sharedDatabase.jobs.tests.env.PAPERCLIP_TEST_DATABASE_URL = "postgres://test-only.invalid/shared";
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
