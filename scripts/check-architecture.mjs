import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('..', import.meta.url))
const sourceRoot = path.join(root, 'src')
const compilerConfig = ts.readConfigFile(
  path.join(root, 'tsconfig.app.json'),
  ts.sys.readFile,
)
const compilerOptions = ts.convertCompilerOptionsFromJson(
  compilerConfig.config.compilerOptions,
  root,
).options

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath]
  })
}
function isTypeOnly(clause) {
  if (!clause) return false
  if (clause.isTypeOnly) return true
  const bindings = clause.namedBindings ?? clause.exportClause
  return (
    !clause.name &&
    bindings &&
    (ts.isNamedImports(bindings) || ts.isNamedExports(bindings)) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((item) => item.isTypeOnly)
  )
}
function collectImports(file) {
  if (!/\.tsx?$/.test(file)) return []
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const imports = []
  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push({
        name: node.moduleSpecifier.text,
        runtime: !isTypeOnly(node.importClause),
      })
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push({
        name: node.moduleSpecifier.text,
        runtime: !isTypeOnly(node),
      })
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push({ name: node.arguments[0].text, runtime: true })
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return imports
}
function resolveSourceImport(name, file, sourceFiles) {
  const direct = path.resolve(path.dirname(file), name)
  if (sourceFiles.has(direct)) return direct
  const resolved = ts.resolveModuleName(name, file, compilerOptions, ts.sys)
    .resolvedModule?.resolvedFileName
  return sourceFiles.has(resolved) ? resolved : undefined
}
function buildGraphs(files) {
  const known = new Set(files)
  const full = new Map()
  const runtime = new Map()
  for (const file of files) {
    full.set(file, new Set())
    runtime.set(file, new Set())
    for (const dependency of collectImports(file)) {
      const target = resolveSourceImport(dependency.name, file, known)
      if (!target) continue
      full.get(file).add(target)
      if (dependency.runtime) runtime.get(file).add(target)
    }
  }
  return { full, runtime }
}
function reachableFiles(graph, entries) {
  const visited = new Set()
  function visit(file) {
    if (visited.has(file)) return
    visited.add(file)
    for (const dependency of graph.get(file) ?? []) visit(dependency)
  }
  for (const entry of entries) visit(entry)
  return visited
}
function findCycles(graph) {
  const completed = new Set()
  const active = new Set()
  const stack = []
  const cycles = []
  function visit(file) {
    if (active.has(file)) {
      cycles.push([...stack.slice(stack.indexOf(file)), file])
      return
    }
    if (completed.has(file)) return
    active.add(file)
    stack.push(file)
    for (const dependency of graph.get(file) ?? []) visit(dependency)
    stack.pop()
    active.delete(file)
    completed.add(file)
  }
  for (const file of graph.keys()) visit(file)
  return cycles
}

const files = listFiles(sourceRoot)
const graphs = buildGraphs(files)
// Tests, Storybook and ambient declarations are independent, supported entry points.
const entries = files.filter(
  (file) =>
    file === path.join(sourceRoot, 'main.tsx') ||
    /\.(?:stories|test)\.tsx?$/.test(file) ||
    file.endsWith('.d.ts') ||
    file.startsWith(path.join(sourceRoot, 'test') + path.sep),
)
const reachable = reachableFiles(graphs.full, entries)
const report = {
  sourceFiles: files.length,
  unreachable: files
    .filter((file) => !reachable.has(file))
    .map((file) => path.relative(root, file)),
  runtimeCycles: findCycles(graphs.runtime).map((cycle) =>
    cycle.map((file) => path.relative(root, file)),
  ),
}
console.log(JSON.stringify(report, null, 2))
if (report.unreachable.length || report.runtimeCycles.length)
  process.exitCode = 1
