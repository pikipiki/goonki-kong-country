#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const TARGETS = ['src', 'tests', 'e2e', '.storybook']
const PICK_IMPORT = "import { pick } from './utils/pick'\n"

function listFiles() {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) {
        walk(path)
      } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
        out.push(path)
      }
    }
  }
  for (const root of TARGETS) {
    walk(root)
  }
  return out
}

function parse(filePath, source) {
  const kind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, kind)
}

function textOf(node, source) {
  return source.slice(node.getStart(), node.getEnd())
}

function indentOf(line) {
  const m = /^(\s*)/.exec(line)
  return m ? m[1] : ''
}

function lineIndentAt(source, pos) {
  const lineStart = source.lastIndexOf('\n', pos - 1) + 1
  return indentOf(source.slice(lineStart, source.indexOf('\n', lineStart)))
}

function ifElseAssign(target, cond, whenTrue, whenFalse, indent) {
  const inner = `${indent}  `
  return [
    `${indent}if (${cond}) {`,
    `${inner}${target} = ${whenTrue}`,
    `${indent}} else {`,
    `${inner}${target} = ${whenFalse}`,
    `${indent}}`,
  ].join('\n')
}

function ifElseReturn(cond, whenTrue, whenFalse, indent) {
  const inner = `${indent}  `
  return [
    `${indent}if (${cond}) {`,
    `${inner}return ${whenTrue}`,
    `${indent}} else {`,
    `${inner}return ${whenFalse}`,
    `${indent}}`,
  ].join('\n')
}

function ifElseExprStmt(cond, whenTrue, whenFalse, indent) {
  const inner = `${indent}  `
  return [
    `${indent}if (${cond}) {`,
    `${inner}${whenTrue}`,
    `${indent}} else {`,
    `${inner}${whenFalse}`,
    `${indent}}`,
  ].join('\n')
}

function containingStatement(node) {
  let current = node
  while (current) {
    if (
      ts.isExpressionStatement(current) ||
      ts.isReturnStatement(current) ||
      ts.isVariableStatement(current)
    ) {
      return current
    }
    if (
      ts.isFunctionLike(current) ||
      ts.isSourceFile(current) ||
      ts.isBlock(current) &&
        current.parent &&
        (ts.isFunctionLike(current.parent) || ts.isSourceFile(current.parent))
    ) {
      if (ts.isBlock(current)) {
        break
      }
    }
    current = current.parent
  }
  return undefined
}

function replaceRange(source, start, end, insert) {
  return source.slice(0, start) + insert + source.slice(end)
}

function fixNested(ce, source) {
  const cond = textOf(ce.condition, source)
  const whenTrue = textOf(ce.whenTrue, source)
  const whenFalse = textOf(ce.whenFalse, source)
  const rep = `pick(${cond}, ${whenTrue}, ${whenFalse})`
  return replaceRange(source, ce.getStart(), ce.getEnd(), rep)
}

function fixOne(ce, source, sourceFile) {
  const parent = ce.parent
  const cond = textOf(ce.condition, source)
  const whenTrue = textOf(ce.whenTrue, source)
  const whenFalse = textOf(ce.whenFalse, source)
  const indent = lineIndentAt(source, ce.getStart())

  if (ts.isReturnStatement(parent) && parent.expression === ce) {
    const rep = ifElseReturn(cond, whenTrue, whenFalse, indent)
    return replaceRange(source, parent.getStart(), parent.getEnd(), rep)
  }

  if (ts.isExpressionStatement(parent) && parent.expression === ce) {
    const rep = ifElseExprStmt(cond, whenTrue, whenFalse, indent)
    return replaceRange(source, parent.getStart(), parent.getEnd(), rep)
  }

  if (
    (ts.isAssignmentExpression(parent) || ts.isBinaryExpression(parent)) &&
    parent.right === ce &&
    parent.operatorToken?.kind === ts.SyntaxKind.EqualsToken
  ) {
    const stmt = parent.parent
    if (ts.isExpressionStatement(stmt) && stmt.expression === parent) {
      const left = textOf(parent.left, source)
      const rep = ifElseAssign(left, cond, whenTrue, whenFalse, indent)
      return replaceRange(source, stmt.getStart(), stmt.getEnd(), rep)
    }
  }

  if (ts.isVariableDeclaration(parent) && parent.initializer === ce) {
    const stmt = parent.parent.parent
    const name = textOf(parent.name, source)
    const isConst = !!(parent.parent.flags & ts.NodeFlags.Const)
    const declKeyword = isConst ? 'let' : textOf(stmt.declarationList, source).startsWith('let') ? 'let' : 'const'
    const mods = stmt.modifiers ? stmt.modifiers.map((m) => m.getText()).join(' ') + ' ' : ''
    const rep = [
      `${mods}${declKeyword} ${name}`,
      ifElseAssign(name, cond, whenTrue, whenFalse, indent),
    ].join('\n')
    return replaceRange(source, stmt.getStart(), stmt.getEnd(), rep)
  }

  if (ts.isJsxExpression(parent) && parent.expression === ce) {
    const rep = `{${ifElseExprStmt(cond, whenTrue, whenFalse, indent + '  ')}}`
    return replaceRange(source, parent.getStart(), parent.getEnd(), rep)
  }

  return fixNested(ce, source)
}

function gatherConditionals(sourceFile) {
  const conditionals = []
  const walk = (node) => {
    if (ts.isConditionalExpression(node)) {
      conditionals.push(node)
    }
    ts.forEachChild(node, walk)
  }
  walk(sourceFile)
  return conditionals
}

function processFile(filePath) {
  let source = readFileSync(filePath, 'utf8')
  let sourceFile = parse(filePath, source)
  let changed = false

  for (let pass = 0; pass < 200; pass++) {
    const conditionals = gatherConditionals(sourceFile)
    if (conditionals.length === 0) {
      break
    }
    conditionals.sort((a, b) => b.getStart() - a.getStart())
    const ce = conditionals[0]
    const next = fixOne(ce, source, sourceFile)
    if (!next || next === source) {
      console.warn(`skip ${filePath}:${source.slice(0, ce.getStart()).split('\n').length}`)
      break
    }
    source = next
    sourceFile = parse(filePath, source)
    changed = true
  }

  if (changed) {
    if (source.includes('pick(') && !source.includes('/utils/pick')) {
      const lines = source.split('\n')
      let insertAt = 0
      while (insertAt < lines.length && lines[insertAt].startsWith('import ')) {
        insertAt++
      }
      const rel = filePath.includes('/src/')
        ? `import { pick } from '${'../'.repeat(
            filePath.split('/src/')[1].split('/').length - 1,
          )}utils/pick'\n`
        : PICK_IMPORT
      lines.splice(insertAt, 0, rel.trimEnd())
      source = `${lines.join('\n')}\n`
    }
    writeFileSync(filePath, source)
  }
  return changed
}

const files = listFiles()
let touched = 0
for (const file of files) {
  try {
    if (processFile(file)) {
      touched += 1
    }
  } catch (err) {
    console.error(file, err.message)
  }
}
console.log(`files ${files.length} updated ${touched}`)
