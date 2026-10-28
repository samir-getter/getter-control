#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowPath = path.join(root, ".github/workflows/getter-control.yml");
const runnerPath = path.join(root, "scripts/run-vitest-stable.mjs");
const groups = {
  server: "general-server-without-chat-or-native-runner",
  chat: "general-chat",
  native: "general-server-native-runner",
  a: "general-workspaces-a",
  b: "general-workspaces-b",
  c: "general-workspaces-c",
};
const laneKeys = ["group", "id", "mode", "native", "shardCount", "shardIndex"];

export function readTestWorkflow() {
  const document = parseDocument(readFileSync(workflowPath, "utf8"));
  assert.equal(document.errors.length, 0, document.errors.map((error) => error.message).join("; "));
  return document.toJS();
}

function validateLane(lane) {
  assert.deepEqual(Object.keys(lane).sort(), laneKeys, "Test lanes must use only the checked fields");
  assert.match(lane.id, /^[a-z0-9-]+$/, "Lane id must be a safe log filename");
  assert.ok(["general", "serialized"].includes(lane.mode), "Unknown test mode");
  assert.equal(typeof lane.native, "boolean", "Native preparation must be explicit");
  assert.ok(Number.isInteger(lane.shardIndex) && lane.shardIndex >= 0, "Invalid shard index");
  assert.ok(Number.isInteger(lane.shardCount) && lane.shardCount >= 0, "Invalid shard count");
  if (lane.mode === "serialized") {
    assert.equal(lane.group, "", "Serialized lanes cannot select a general group");
    assert.ok(lane.shardCount > 0, "Serialized lanes need explicit shards");
  } else {
    assert.ok(Object.values(groups).includes(lane.group), "Unknown or caller-dependent general group");
  }
  assert.equal(lane.native, lane.group === groups.native, "Native process preparation must match its lane");
  if ([groups.native, groups.b, groups.c].includes(lane.group)) {
    assert.equal(lane.shardCount, 0, "This group cannot be sharded");
    assert.equal(lane.shardIndex, 0, "An unsharded group cannot select a slice");
  } else {
    assert.ok(lane.shardCount > 0 && lane.shardIndex < lane.shardCount, "Invalid or missing test slice");
  }
}

function verifyHomeInitialization(job, name) {
  assert.equal(job?.env?.GETTER_CONTROL_HOME, undefined, "Initialize application homes in a step, not job-level env");
  assert.equal(job?.env?.PAPERCLIP_HOME, undefined, "Initialize application homes in a step, not job-level env");
  const initialize = job?.steps?.find((step) => step.name === "Initialize isolated application home");
  assert.ok(initialize && job.steps.indexOf(initialize) < job.steps.findIndex((step) => step.name === "Install workspace"), "Initialize an isolated home before workspace setup");
  assert.equal(initialize.if, undefined, "Every job must initialize an isolated home");
  assert.notEqual(initialize["continue-on-error"], true, "Home initialization must succeed");
  const folder = name === "source" ? "getter-control-source" : "getter-control-tests-$GETTER_CONTROL_TEST_LANE_ID";
  assert.ok(initialize.run?.includes('calm_home="$RUNNER_TEMP/' + folder + '"'), "Home must use the runner temporary directory");
  assert.ok(initialize.run.includes('mkdir -p "$calm_home"'), "Create the isolated application home");
  assert.ok(initialize.run.includes("printf 'GETTER_CONTROL_HOME=%s\\nPAPERCLIP_HOME=%s\\n' \"$calm_home\" \"$calm_home\" >> \"$GITHUB_ENV\""), "Both home aliases must share the isolated job home");
  if (name === "tests") assert.equal(initialize.env?.GETTER_CONTROL_TEST_LANE_ID, "${{ matrix.id }}", "Test home must use the checked lane id");
}

function verifyLogUpload(job, name) {
  const stepName = name === "source" ? "Keep source check results on success or failure" : "Keep test results on success or failure";
  const upload = job?.steps?.find((step) => step.name === stepName);
  assert.equal(upload?.uses, "actions/upload-artifact@v4", "Every job must upload its check results");
  assert.equal(upload.if, "always()", "Result upload must run on success or failure");
  assert.notEqual(upload["continue-on-error"], true, "Artifact upload failure must fail the job");
  assert.equal(upload.with?.path, ".ci-test-logs/", "Artifact upload must stay scoped to the check log directory");
  assert.equal(upload.with?.["include-hidden-files"], true, "Artifact upload must include the hidden log directory");
  assert.equal(upload.with?.["if-no-files-found"], "error", "Missing check logs must fail artifact upload");
}

export function workflowLanes(workflow) {
  assert.equal(workflow.defaults?.run?.shell, "bash", "Piped setup checks require the Bash pipefail shell");
  const job = workflow.jobs?.tests;
  assert.ok(job, "The workflow must declare its test job");
  verifyHomeInitialization(workflow.jobs.source, "source");
  verifyHomeInitialization(job, "tests");
  verifyLogUpload(workflow.jobs.source, "source");
  verifyLogUpload(job, "tests");
  assert.equal(job.needs, "source", "Tests must depend on the source checks");
  assert.notEqual(job["continue-on-error"], true, "Test failure must fail the job");
  assert.equal(job.strategy?.["fail-fast"], false, "One failure must not cancel other test lanes");
  assert.deepEqual(Object.keys(job.strategy?.matrix ?? {}), ["include"], "Use the explicit checked lane matrix");
  const lanes = job.strategy.matrix.include;
  assert.ok(Array.isArray(lanes) && lanes.length > 0, "Empty test matrix");
  lanes.forEach(validateLane);
  assert.equal(new Set(lanes.map((lane) => lane.id)).size, lanes.length, "Duplicate lane ids");
  const run = job.steps?.find((step) => step.name === "Run checked test lane");
  assert.equal(run?.run?.trim(), "node scripts/check-getter-control-test-plan.mjs --run-lane", "Tests must execute the checked lane arguments");
  assert.equal(run.env?.GETTER_CONTROL_TEST_LANE, "${{ toJSON(matrix) }}", "The executed lane must come from the actual matrix");
  assert.equal(run.if, undefined, "Every matrix lane must run");
  assert.notEqual(run["continue-on-error"], true, "Test failure must not be ignored");
  const prepare = job.steps.find((step) => step.name === "Prepare native process fixtures before collection");
  assert.ok(prepare && job.steps.indexOf(prepare) < job.steps.indexOf(run), "Native fixtures must be prepared before test collection");
  assert.equal(prepare.if, "matrix.native", "Native preparation must run for the native lane");
  for (const command of [
    "pnpm --filter @paperclipai/paperclip-runner build:typescript",
    "pnpm --filter @paperclipai/paperclip-runner build:rust",
    "--bin paperclip-runnerd --bin fake-codex-app-server",
    "test -x packages/paperclip-runner/runner/target/debug/fake-codex-app-server",
    "test -x packages/paperclip-runner/runner/target/release/fake-codex-app-server",
    "test -x packages/paperclip-runner/dist/bin/paperclip-runnerd",
  ]) assert.ok(prepare.run.includes(command), "Missing native prerequisite: " + command);
  for (const env of [workflow.env, job.env, run.env]) {
    assert.equal(env?.PAPERCLIP_TEST_DATABASE_URL, undefined, "These shards use isolated embedded test databases");
  }
  return lanes;
}

export function runnerArguments(lane) {
  validateLane(lane);
  return [
    "--mode", lane.mode,
    ...(lane.group ? ["--group", lane.group] : []),
    ...(lane.shardCount ? ["--shard-index", String(lane.shardIndex), "--shard-count", String(lane.shardCount)] : []),
  ];
}

export function createRunnerPlanner() {
  const cache = new Map();
  return (args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) {
      const env = { ...process.env };
      delete env.PAPERCLIP_TEST_DATABASE_URL;
      const result = spawnSync(process.execPath, [runnerPath, ...args, "--dry-run"], {
        cwd: root, encoding: "utf8", env, maxBuffer: 16 * 1024 * 1024,
      });
      assert.equal(result.status, 0, "Stable runner rejected the plan: " + result.stderr);
      cache.set(key, JSON.parse(result.stdout));
    }
    return cache.get(key);
  };
}

function completeSlices(lanes, name) {
  assert.ok(lanes.length > 0, "Missing group: " + name);
  const count = lanes[0].shardCount;
  assert.ok(lanes.every((lane) => lane.shardCount === count), "Inconsistent shard count for " + name);
  if (count === 0) {
    assert.equal(lanes.length, 1, "An unsharded group must run once: " + name);
  } else {
    assert.deepEqual(lanes.map((lane) => lane.shardIndex).sort((a, b) => a - b),
      Array.from({ length: count }, (_, index) => index), "Missing or duplicate shard indices for " + name);
  }
}

function claimFiles(seen, files, label) {
  assert.ok(Array.isArray(files) && files.length > 0, "Empty selected file list: " + label);
  for (const file of files) {
    assert.equal(typeof file, "string", "Test file must be a path");
    assert.ok(!seen.has(file), "Test file assigned twice: " + file);
    seen.add(file);
  }
}

function sameSet(actual, expected, label) {
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);
}

function configuredWorkspaceProjects() {
  const text = readFileSync(path.join(root, "vitest.config.ts"), "utf8");
  const marker = text.indexOf("projects:");
  const start = text.indexOf("[", marker);
  const end = text.indexOf("]", start);
  assert.ok(marker >= 0 && start >= 0 && end > start, "Root Vitest projects must remain an explicit list");
  const directories = JSON.parse("[" + text.slice(start + 1, end).trim().replace(/,$/, "") + "]");
  assert.ok(Array.isArray(directories) && directories.every((directory) => typeof directory === "string"), "Unsupported Vitest project list");
  const names = directories.map((directory) => {
    const folder = path.resolve(root, directory);
    assert.ok(folder.startsWith(root + path.sep), "Vitest project must be in this checkout");
    return JSON.parse(readFileSync(path.join(folder, "package.json"), "utf8")).name;
  }).filter((name) => name !== "@paperclipai/server");
  assert.equal(new Set(names).size, names.length, "Duplicate configured Vitest project names");
  return names;
}

function configuredChatSuite() {
  const prefix = "const chatSuite = ";
  const lines = readFileSync(runnerPath, "utf8").split("\n").map((line) => line.trim());
  const declarations = lines.filter((line) => line.startsWith(prefix));
  assert.equal(declarations.length, 1, "Stable runner chat suite declaration changed");
  const file = JSON.parse(declarations[0].slice(prefix.length).replace(/;$/, ""));
  assert.equal(typeof file, "string", "Chat suite must be a declared file");
  return file;
}

export function verifyTestPlan(workflow = readTestWorkflow(), plan = createRunnerPlanner()) {
  const lanes = workflowLanes(workflow);
  const byGroup = (group) => lanes.filter((lane) => lane.group === group);
  for (const group of Object.values(groups)) completeSlices(byGroup(group), group);
  completeSlices(lanes.filter((lane) => lane.mode === "serialized"), "serialized");
  const general = plan(["--mode", "general", "--group", "general-server", "--shard-index", "0", "--shard-count", "1"]);
  const serialized = plan(["--mode", "serialized", "--shard-index", "0", "--shard-count", "1"]);
  const serverSeen = new Set();
  for (const lane of [...byGroup(groups.server), ...byGroup(groups.native)]) {
    claimFiles(serverSeen, plan(runnerArguments(lane)).selectedGeneralServerSuites, lane.id);
  }
  const chatWorkers = byGroup(groups.chat).flatMap((lane) => plan(runnerArguments(lane)).chatVitestShards);
  assert.ok(chatWorkers.length > 0 && chatWorkers.every((worker) => Number.isInteger(worker.count) && worker.count > 0), "Invalid chat workers");
  const chatCount = chatWorkers[0].count;
  assert.ok(chatWorkers.every((worker) => worker.count === chatCount), "Inconsistent chat worker counts");
  assert.deepEqual(chatWorkers.map((worker) => worker.index).sort((a, b) => a - b),
    Array.from({ length: chatCount }, (_, index) => index), "Missing or duplicate chat workers");
  claimFiles(serverSeen, [configuredChatSuite()], "chat");
  sameSet(serverSeen, new Set(general.selectedGeneralServerSuites), "General server coverage differs from the full runner");
  const serialSeen = new Set();
  for (const lane of lanes.filter((lane) => lane.mode === "serialized")) {
    claimFiles(serialSeen, plan(runnerArguments(lane)).selectedSerializedSuites, lane.id);
  }
  sameSet(serialSeen, new Set(serialized.selectedSerializedSuites), "Serialized coverage differs from the full runner");
  for (const file of serialSeen) assert.ok(!serverSeen.has(file), "Serialized file also selected in the general lane: " + file);
  const aPlans = byGroup(groups.a).map((lane) => plan(runnerArguments(lane)));
  const aProjects = aPlans[0].workspaceProjects;
  for (let index = 0; index < aPlans.length; index += 1) {
    sameSet(new Set(aPlans[index].workspaceProjects), new Set(aProjects), "UI/CLI slices must select the same projects");
    const lane = byGroup(groups.a)[index];
    assert.equal(aPlans[index].workspacesVitestShard, lane.shardCount > 1 ? String(lane.shardIndex + 1) + "/" + lane.shardCount : null, "UI/CLI test slice differs");
  }
  const projects = new Set(aProjects);
  for (const group of [groups.b, groups.c]) {
    const projectPlan = plan(runnerArguments(byGroup(group)[0]));
    assert.equal(projectPlan.workspacesVitestShard, null, "Unsharded package group selected a slice");
    for (const project of projectPlan.workspaceProjects) {
      assert.ok(!projects.has(project), "Workspace project selected twice: " + project);
      projects.add(project);
    }
  }
  sameSet(projects, new Set(configuredWorkspaceProjects()), "Workspace coverage differs from the root Vitest config");
  return {
    kind: "Planned test selection; not execution",
    lanes: lanes.length,
    generalServerFiles: serverSeen.size,
    serializedServerFiles: serialSeen.size,
    workspaceProjects: [...projects].sort(),
    chatWorkers: chatWorkers.map((worker) => worker.index).sort((a, b) => a - b),
    groups: Object.fromEntries([...Object.values(groups), "serialized"].map((group) => [group, group === "serialized" ? lanes.filter((lane) => lane.mode === group).length : byGroup(group).length])),
  };
}

export async function executeTestLane(lane, {
  cwd = root, logDir = path.join(root, ".ci-test-logs"),
  environment = process.env, executable = "pnpm", executableArguments = [],
} = {}) {
  validateLane(lane);
  assert.equal(environment.PAPERCLIP_TEST_DATABASE_URL, undefined, "These lanes require per-job embedded test databases");
  const childEnvironment = { ...environment };
  delete childEnvironment.GETTER_CONTROL_HOME;
  const args = [
    lane.mode === "serialized" ? "test:run:serialized" : "test:run:general", "--",
    ...(lane.group ? ["--group", lane.group] : []),
    ...(lane.shardCount ? ["--shard-index", String(lane.shardIndex), "--shard-count", String(lane.shardCount)] : []),
  ];
  mkdirSync(logDir, { recursive: true });
  const log = createWriteStream(path.join(logDir, lane.id + ".log"));
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const command = [executable, ...executableArguments, ...args];
  console.log("[getter-tests] " + command.join(" "));
  const child = spawn(executable, [...executableArguments, ...args], { cwd, env: childEnvironment, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", (chunk) => { process.stdout.write(chunk); log.write(chunk); });
  child.stderr.on("data", (chunk) => { process.stderr.write(chunk); log.write(chunk); });
  let code;
  let signal;
  let failure;
  try {
    ({ code, signal } = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (exitCode, exitSignal) => resolve({ code: exitCode, signal: exitSignal }));
    }));
  } catch (error) {
    failure = error.message;
    code = 1;
    const message = "[getter-tests] Could not execute test command: " + failure + "\n";
    process.stderr.write(message);
    log.write(message);
  } finally {
    await new Promise((resolve) => log.end(resolve));
  }
  const result = {
    lane, command, sourceSha: environment.GITHUB_SHA ?? null,
    nodeVersion: process.version, platform: process.platform, arch: process.arch,
    startedAt, finishedAt: new Date().toISOString(), elapsedMs: Date.now() - start,
    exitCode: code, signal, failure,
  };
  writeFileSync(path.join(logDir, lane.id + ".json"), JSON.stringify(result, null, 2) + "\n");
  return result;
}

async function runLane() {
  const requested = JSON.parse(process.env.GETTER_CONTROL_TEST_LANE ?? "null");
  assert.ok(requested, "GETTER_CONTROL_TEST_LANE must contain a matrix lane");
  validateLane(requested);
  const lane = workflowLanes(readTestWorkflow()).find((candidate) => candidate.id === requested.id);
  assert.deepEqual(requested, lane, "Executed lane must match the checked workflow matrix");
  const result = await executeTestLane(lane);
  process.exitCode = result.exitCode ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.ok(process.argv.length <= 3, "Only --run-lane is supported");
    if (process.argv[2] === "--run-lane") await runLane();
    else {
      assert.equal(process.argv[2], undefined, "Unknown option");
      console.log(JSON.stringify(verifyTestPlan(), null, 2));
    }
  } catch (error) {
    console.error("[getter-tests] " + error.message);
    process.exitCode = 1;
  }
}
