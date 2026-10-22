import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { browserOutputDirectory } from './lib/browser-test.mjs'
import { recordedFixture, fixturePath } from './lib/playthrough/fixtures.mjs'

const name = process.argv[2]
const summaryPath =
  process.argv[3] || `${browserOutputDirectory()}${name}-playthrough.json`
const summary = JSON.parse(readFileSync(summaryPath, 'utf8'))
assert.equal(summary.stage, name)
assert.ok(
  ['clear', 'victory'].includes(summary.status),
  'Only a completed playthrough can become a fixture',
)
assert.equal(summary.deaths, 0, 'A fixture must not lose a life')
assert.equal(
  summary.errors.length,
  0,
  'A fixture must not hide a browser error',
)
assert.ok(summary.verifiedTransitions > 0)
assert.equal(
  summary.controlSource,
  'planner',
  'Record a fresh PLAYTHROUGH_REPLAN=1 run first',
)
const log = JSON.parse(
  readFileSync(path.join(summary.artifacts, 'inputs.json'), 'utf8'),
)
const fixture = recordedFixture(name, log, summary.frameGroup)
writeFileSync(fixturePath(name), JSON.stringify(fixture, null, 2) + '\n')
console.log(
  `Recorded ${name}: ${fixture.steps.length} verified control groups. Review the fixture diff and rerun its tests.`,
)
