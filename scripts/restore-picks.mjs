#!/usr/bin/env node
/**
 * Reverts `let __pickN` + if/else prelude from remove-ternaries.mjs
 * into `pick(condition, whenTrue, whenFalse)` (see src/utils/pick.ts).
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const PICK_UTIL = join(ROOT, 'src/utils/pick.ts')
const TARGETS = ['src', 'tests', 'e2e', '.storybook']

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
    walk(join(ROOT, root))
  }
  return out
}

function importPathFor(filePath) {
  const fromDir = dirname(filePath)
  let rel = relative(fromDir, PICK_UTIL).replace(/\\/g, '/')
  if (!rel.startsWith('.')) {
    rel = `./${rel}`
  }
  return rel.replace(/\.ts$/, '')
}

function ensureImport(source, filePath) {
  const marker = '/utils/pick'
  if (source.split('\n').some((line) => line.includes(marker))) {
    return source
  }
  const importLine = `import { pick } from '${importPathFor(filePath)}'`
  const lines = source.split('\n')
  let insertAt = 0
  while (insertAt < lines.length) {
    const line = lines[insertAt]
    if (!line.startsWith('import ')) {
      break
    }
    insertAt++
    if (line.includes('{') && !line.includes('}')) {
      while (insertAt < lines.length && !lines[insertAt].includes('}')) {
        insertAt++
      }
      if (insertAt < lines.length) {
        insertAt++
      }
    }
  }
  lines.splice(insertAt, 0, importLine)
  return `${lines.join('\n')}\n`
}

function readPickBlock(lines, start) {
  const decl = /^(\s*)let (__pick\d+)\s*$/.exec(lines[start])
  if (!decl) {
    return null
  }
  const name = decl[2]
  let cursor = start + 1
  const ifLine = /^(\s*)if \((.+)\) \{\s*$/.exec(lines[cursor])
  if (!ifLine) {
    return null
  }
  const cond = ifLine[2]
  cursor++
  const trueLines = []
  while (cursor < lines.length && !/^\s*\}\s*else\s*\{\s*$/.test(lines[cursor])) {
    trueLines.push(lines[cursor])
    cursor++
  }
  if (cursor >= lines.length) {
    return null
  }
  cursor++
  const falseLines = []
  while (cursor < lines.length && !/^\s*\}\s*$/.test(lines[cursor])) {
    falseLines.push(lines[cursor])
    cursor++
  }
  if (cursor >= lines.length) {
    return null
  }
  const stripAssign = (blockLines) => {
    const joined = blockLines.join('\n').trim()
    const single = new RegExp(`^${name} = (.+)$`)
    const m = single.exec(joined.replace(/\s+/g, ' ').replace(` ${name} = `, `${name} = `))
    if (m) {
      return blockLines
        .join('\n')
        .replace(new RegExp(`^\\s*${name} = `), '')
        .trim()
    }
    const first = blockLines[0]?.trim() ?? ''
    if (first.startsWith(`${name} =`)) {
      const rest = [
        first.slice(`${name} =`.length).trim(),
        ...blockLines.slice(1),
      ]
        .join('\n')
        .trim()
      return rest
    }
    return null
  }
  const whenTrue = stripAssign(trueLines)
  const whenFalse = stripAssign(falseLines)
  if (whenTrue === null || whenFalse === null) {
    return null
  }
  return {
    name,
    cond,
    whenTrue,
    whenFalse,
    end: cursor,
  }
}

function processSource(source, filePath) {
  if (!source.includes('__pick')) {
    return { source, changed: false }
  }

  let lines = source.split('\n')
  let changed = false

  for (let pass = 0; pass < 500; pass++) {
    let block = null
    let start = -1
    for (let idx = 0; idx < lines.length; idx++) {
      const candidate = readPickBlock(lines, idx)
      if (candidate) {
        block = candidate
        start = idx
        break
      }
    }
    if (!block) {
      break
    }
    const replacement = `pick(${block.cond}, ${block.whenTrue}, ${block.whenFalse})`
    const before = lines.slice(0, start)
    const after = lines.slice(block.end + 1)
    const merged = [...before, ...after].join('\n')
    lines = merged
      .replace(new RegExp(`\\b${block.name}\\b`, 'g'), replacement)
      .split('\n')
    changed = true
  }

  let next = lines.join('\n')
  if (changed && next.includes('pick(')) {
    next = ensureImport(next, filePath)
  }

  return { source: next, changed }
}

let touched = 0
for (const filePath of listFiles()) {
  if (filePath === PICK_UTIL) {
    continue
  }
  const original = readFileSync(filePath, 'utf8')
  const { source, changed } = processSource(original, filePath)
  if (changed) {
    writeFileSync(filePath, source)
    touched++
  }
}

const remaining = listFiles().filter((file) =>
  readFileSync(file, 'utf8').includes('__pick'),
)
console.log(`updated ${touched} files`)
if (remaining.length > 0) {
  console.log(`remaining __pick in ${remaining.length} files:`)
  for (const file of remaining) {
    console.log(`  ${relative(ROOT, file)}`)
  }
}
