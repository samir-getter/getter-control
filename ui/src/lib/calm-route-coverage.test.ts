import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { API, type Snapshot } from "typescript/unstable/sync";
import {
  isArrayLiteralExpression, isArrowFunction, isAsExpression, isCallExpression,
  isFunctionDeclaration, isIdentifier, isImportSpecifier, isJsxAttribute, isJsxElement,
  isJsxExpression, isJsxSelfClosingElement, isJsxSpreadAttribute, isNoSubstitutionTemplateLiteral,
  isParenthesizedExpression, isPropertyAccessExpression, isStringLiteral, isTemplateExpression,
  isVariableDeclaration, type Expression, type JsxOpeningElement, type JsxSelfClosingElement,
  type Node, type SourceFile,
} from "typescript/unstable/ast";
import baseline from "./calm-route-baseline.json";
import { CALM_ROUTE_HOMES } from "./calm-navigation";

const sourceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(sourceDir, "App.tsx");
const tabsPath = path.join(sourceDir, "lib/agent-filter-tabs.ts");
const normalized = (filename: string) => filename.replaceAll("\\", "/").toLowerCase();

function walk(node: Node, visitor: (node: Node) => void): void {
  visitor(node);
  node.forEachChild((child) => walk(child, visitor));
}

function unsupported(node: Node, source: SourceFile, reason: string): never {
  const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
  throw new Error(`${source.fileName}:${line + 1}:${character + 1}: ${reason}: ${node.getText(source)}`);
}

function unwrap(expression: Expression): Expression {
  return isAsExpression(expression) || isParenthesizedExpression(expression) ? unwrap(expression.expression) : expression;
}

function agentTabs(source: SourceFile): string[] {
  let result: string[] | undefined;
  walk(source, (node) => {
    if (!isVariableDeclaration(node) || !isIdentifier(node.name) || node.name.text !== "AGENT_FILTER_TABS") return;
    if (!node.initializer) unsupported(node, source, "AGENT_FILTER_TABS must have a literal initializer");
    const value = unwrap(node.initializer);
    if (!isArrayLiteralExpression(value)) unsupported(value, source, "Unsupported dynamic AGENT_FILTER_TABS");
    result = value.elements.map((element) => {
      if (!isStringLiteral(element)) unsupported(element, source, "Unsupported dynamic agent filter");
      return element.text;
    });
  });
  if (!result?.length) throw new Error(`${source.fileName}: missing AGENT_FILTER_TABS literal array`);
  return result;
}

function mappedTabs(node: Node, variable: string, source: SourceFile, tabs: string[]): string[] {
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (!isArrowFunction(ancestor)) continue;
    const call = ancestor.parent;
    if (!isCallExpression(call) || !isPropertyAccessExpression(call.expression)
      || call.expression.name.text !== "map" || !isIdentifier(call.expression.expression)
      || call.expression.expression.text !== "AGENT_FILTER_TABS" || call.arguments[0] !== ancestor
      || ancestor.parameters.length !== 1 || !isIdentifier(ancestor.parameters[0]!.name)
      || ancestor.parameters[0]!.name.text !== variable) {
      unsupported(node, source, "Unsupported dynamic Route path (only the audited agent-tab map is supported)");
    }
    return tabs;
  }
  return unsupported(node, source, "Dynamic Route path is not inside the agent-tab map");
}

function pathValues(node: Node, source: SourceFile, tabs: string[]): string[] {
  if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) return [node.text];
  if (isJsxExpression(node) && node.expression) return pathValues(unwrap(node.expression), source, tabs);
  if (isTemplateExpression(node)) {
    if (node.templateSpans.length !== 1) unsupported(node, source, "Unsupported dynamic Route template with multiple substitutions");
    let values = [node.head.text];
    for (const span of node.templateSpans) {
      if (!isIdentifier(span.expression)) unsupported(span.expression, source, "Unsupported dynamic Route template");
      const substitutions = mappedTabs(node, span.expression.text, source, tabs);
      values = values.flatMap((value) => substitutions.map((substitution) => value + substitution + span.literal.text));
    }
    return values;
  }
  return unsupported(node, source, "Unsupported dynamic Route path");
}

function routeOpening(node: Node, names: Set<string>): JsxOpeningElement | JsxSelfClosingElement | null {
  const opening = isJsxElement(node) ? node.openingElement : isJsxSelfClosingElement(node) ? node : null;
  return opening && isIdentifier(opening.tagName) && names.has(opening.tagName.text) ? opening : null;
}

function routeAttributes(opening: JsxOpeningElement | JsxSelfClosingElement, source: SourceFile, tabs: string[]) {
  let paths: string[] | undefined;
  let index = false;
  for (const attribute of opening.attributes.properties) {
    if (isJsxSpreadAttribute(attribute)) unsupported(attribute, source, "Spread Route attributes could hide dynamic paths");
    if (!isJsxAttribute(attribute) || !isIdentifier(attribute.name)) continue;
    if (attribute.name.text === "path") {
      if (!attribute.initializer) unsupported(attribute, source, "Route path needs a value");
      paths = pathValues(attribute.initializer, source, tabs);
    }
    if (attribute.name.text === "index") {
      if (attribute.initializer) unsupported(attribute, source, "Unsupported dynamic Route index");
      index = true;
    }
  }
  return { paths, index };
}

function joinRoutes(parents: string[], children: string[]): string[] {
  return parents.flatMap((parent) => children.map((child) => child.startsWith("/") ? child : `${parent.replace(/\/$/, "")}/${child}`.replace(/\/$/, "") || "/"));
}

function ancestorPaths(node: Node, names: Set<string>, source: SourceFile, tabs: string[]): string[] {
  const ancestors: Node[] = [];
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (routeOpening(ancestor, names)) ancestors.unshift(ancestor);
  }
  return ancestors.reduce((paths, ancestor) => {
    const { paths: children } = routeAttributes(routeOpening(ancestor, names)!, source, tabs);
    return children ? joinRoutes(paths, children) : paths;
  }, ["/"]);
}

function extractRoutes(source: SourceFile, filters: SourceFile): string[] {
  const tabs = agentTabs(filters);
  const names = new Set(["Route"]);
  walk(source, (node) => {
    if (isImportSpecifier(node) && (node.propertyName?.text ?? node.name.text) === "Route") names.add(node.name.text);
  });
  const boardMounts: string[] = [];
  walk(source, (node) => {
    if (isCallExpression(node) && isIdentifier(node.expression) && node.expression.text === "boardRoutes") {
      boardMounts.push(...ancestorPaths(node, names, source, tabs));
    }
  });
  const routes: string[] = [];
  walk(source, (node) => {
    const opening = routeOpening(node, names);
    if (!opening) return;
    const attributes = routeAttributes(opening, source, tabs);
    if (!attributes.paths && !attributes.index) return;
    let parents = ancestorPaths(node, names, source, tabs);
    for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
      if (isFunctionDeclaration(ancestor) && ancestor.name?.text === "boardRoutes") {
        if (!boardMounts.length) unsupported(node, source, "boardRoutes has no registered host");
        parents = joinRoutes(boardMounts, parents.map((parent) => parent.replace(/^\//, "")));
        break;
      }
    }
    routes.push(...joinRoutes(parents, attributes.paths ?? [""]));
  });
  return routes;
}

function assertRouteHomes(patterns: readonly string[]): void {
  const homes = new Set(CALM_ROUTE_HOMES.map((home) => home.pattern));
  const orphaned = [...new Set(patterns)].filter((pattern) => !homes.has(pattern));
  if (orphaned.length) throw new Error(`Routes without an explicit CALM home: ${orphaned.join(", ")}`);
}

function assertBaselinePreserved(patterns: readonly string[]): void {
  const current = new Set(patterns);
  const missing = baseline.patterns.filter((pattern) => !current.has(pattern));
  if (missing.length) throw new Error(`Audited routes/aliases disappeared: ${missing.join(", ")}`);
}

const fixtures = {
  nested: 'function App() { return <Routes><Route path="tenant"><Route element={<Gate/>}>{flag ? <Route path="one"/> : <Route path="two"/>}<Route index/><Route path="detail"><Route path="history"/></Route></Route></Route></Routes> }',
  orphan: 'function App() { return <Routes><Route path=":companyPrefix"><Route path="future-page"/></Route></Routes> }',
  dynamic: 'function App() { return <Routes><Route path={buildPath()}/></Routes> }',
  spread: 'function App() { return <Routes><Route {...routeProps}/></Routes> }',
  multiple: 'function App() { return <Routes>{AGENT_FILTER_TABS.map((tab) => <Route path={`agents/${tab}/${tab}`}/>)}</Routes> }',
  mapped: 'function App() { return <Routes>{AGENT_FILTER_TABS.map((filter) => <Route path={`agents/${filter}`}/>)}</Routes> }',
  newTabs: 'export const AGENT_FILTER_TABS = ["all", "maintenance"] as const;',
  dynamicTabs: 'export const AGENT_FILTER_TABS = getTabs();',
};

let api: API;
let snapshot: Snapshot;
const fixturePaths = Object.fromEntries(Object.keys(fixtures).map((name) => [name, path.join(sourceDir, "lib", `__calm-route-fixture-${name}.tsx`)]));

function sourceFile(filename: string): SourceFile {
  const source = snapshot.getDefaultProjectForFile(filename)?.program.getSourceFile(filename);
  if (!source) throw new Error(`TypeScript could not parse ${filename}`);
  return source;
}

beforeAll(() => {
  const virtual = new Map(Object.entries(fixtures).map(([name, content]) => [normalized(fixturePaths[name]!), content]));
  api = new API({
    cwd: path.resolve(sourceDir, "../.."),
    fs: {
      fileExists: (filename) => virtual.has(normalized(filename)) ? true : undefined,
      readFile: (filename) => virtual.get(normalized(filename)),
    },
  });
  snapshot = api.updateSnapshot({ openFiles: [appPath, tabsPath, ...Object.values(fixturePaths)] });
}, 30_000);

afterAll(() => {
  snapshot?.dispose();
  api?.close();
});

describe("live App route coverage", () => {
  it("gives every actual route an explicit home and preserves every audited alias", () => {
    const patterns = extractRoutes(sourceFile(appPath), sourceFile(tabsPath));
    expect(new Set(patterns).size).toBeGreaterThanOrEqual(234);
    expect(() => assertRouteHomes(patterns)).not.toThrow();
    expect(() => assertBaselinePreserved(patterns)).not.toThrow();
    expect(new Set(CALM_ROUTE_HOMES.map((home) => home.pattern))).toEqual(new Set(patterns));
  });

  it("walks both conditional branches and nested/index routes through pathless gates", () => {
    expect(extractRoutes(sourceFile(fixturePaths.nested!), sourceFile(tabsPath))).toEqual(["/tenant", "/tenant/one", "/tenant/two", "/tenant", "/tenant/detail", "/tenant/detail/history"]);
  });

  it("rejects a new static declaration even when the plugin wildcard would match at runtime", () => {
    const patterns = extractRoutes(sourceFile(fixturePaths.orphan!), sourceFile(tabsPath));
    expect(() => assertRouteHomes(patterns)).toThrow("/:companyPrefix/future-page");
  });

  it("rejects a removed audited alias", () => {
    const patterns = extractRoutes(sourceFile(appPath), sourceFile(tabsPath)).filter((pattern) => pattern !== "/:companyPrefix/status-cards/:cardId");
    expect(() => assertBaselinePreserved(patterns)).toThrow("/:companyPrefix/status-cards/:cardId");
  });

  it("expands the actual map constant, so new filters need homes", () => {
    expect(extractRoutes(sourceFile(fixturePaths.mapped!), sourceFile(fixturePaths.newTabs!))).toEqual(["/agents/all", "/agents/maintenance"]);
    expect(() => assertRouteHomes(extractRoutes(sourceFile(fixturePaths.mapped!), sourceFile(fixturePaths.newTabs!)))).toThrow("/agents/maintenance");
  });

  it.each(["dynamic", "spread", "multiple"])("fails loudly for unsupported %s route expressions", (name) => {
    expect(() => extractRoutes(sourceFile(fixturePaths[name]!), sourceFile(tabsPath))).toThrow(/fixture-.*\.tsx:\d+:\d+:/);
  });

  it("fails loudly when the filter constant becomes dynamic", () => {
    expect(() => extractRoutes(sourceFile(fixturePaths.mapped!), sourceFile(fixturePaths.dynamicTabs!))).toThrow("Unsupported dynamic AGENT_FILTER_TABS");
  });
});
