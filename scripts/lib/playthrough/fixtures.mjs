import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const stages = { canyon: 1, coral: 3, boss: 6 }
const keys = new Set([
  'right',
  'left',
  'up',
  'down',
  'jump',
  'run',
  'action',
  'swap',
])

export function fixturePath(name) {
  assert.ok(Object.hasOwn(stages, name), `Unknown stage: ${name}`)
  return fileURLToPath(
    new URL(
      `../../../tests/fixtures/playthrough/${name}.json`,
      import.meta.url,
    ),
  )
}

export function validateFixture(name, fixture) {
  assert.equal(fixture.version, 1, 'Unsupported playthrough fixture version')
  assert.equal(
    fixture.stageId,
    stages[name],
    'Fixture stage does not match its entry point',
  )
  assert.equal(fixture.expectedPhase, name === 'boss' ? 'victory' : 'clear')
  assert.equal(typeof fixture.originalRoute, 'boolean')
  assert.ok(
    Array.isArray(fixture.steps) && fixture.steps.length > 0,
    'Missing playthrough controls',
  )
  for (const step of fixture.steps) {
    assert.ok(
      Number.isInteger(step.frames) && step.frames >= 1 && step.frames <= 60,
      'Control groups must contain 1–60 physics frames',
    )
    assert.ok(
      Array.isArray(step.keys) && step.keys.every((key) => keys.has(key)),
      'Invalid gameplay control',
    )
    assert.equal(
      new Set(step.keys).size,
      step.keys.length,
      'Duplicate gameplay control',
    )
  }
  return fixture
}

export function loadFixture(name) {
  return validateFixture(
    name,
    JSON.parse(readFileSync(fixturePath(name), 'utf8')),
  )
}

/** Keep real input edges; merge only adjacent groups with identical held keys. */
export function recordedFixture(name, log, frameGroup) {
  const steps = []
  for (const entry of log) {
    const frames = entry.frames ?? frameGroup
    const previous = steps.at(-1)
    if (
      previous &&
      JSON.stringify(previous.keys) === JSON.stringify(entry.keys) &&
      previous.frames + frames <= 60
    ) {
      previous.frames += frames
    } else steps.push({ frames, keys: entry.keys })
  }
  return validateFixture(name, {
    version: 1,
    stageId: stages[name],
    originalRoute: true,
    expectedPhase: name === 'boss' ? 'victory' : 'clear',
    steps,
  })
}
