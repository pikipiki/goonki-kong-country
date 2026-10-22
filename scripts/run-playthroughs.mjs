import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, createWriteStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { browserOutputDirectory } from './lib/browser-test.mjs'

const scripts = {
  canyon: 'scripts/playthrough-canyon.mjs',
  coral: 'scripts/playthrough-coral.mjs',
  boss: 'scripts/boss-battle-browser.mjs',
}
const root = fileURLToPath(new URL('../', import.meta.url))
const attempts = Number(process.env.PLAYTHROUGH_RUNS || 3)
const selected = process.argv.slice(2)
const stages = selected.length ? selected : Object.keys(scripts)
assert.ok(
  Number.isInteger(attempts) && attempts >= 1 && attempts <= 20,
  'PLAYTHROUGH_RUNS must be between 1 and 20',
)
for (const stage of stages)
  assert.ok(Object.hasOwn(scripts, stage), `Unknown playthrough: ${stage}`)
const directory = `${browserOutputDirectory()}stability-${new Date().toISOString().replaceAll(':', '-')}/`
mkdirSync(directory, { recursive: true })
const profiles = [
  { viewport: '1100x700', delay: '0' },
  { viewport: '390x844', delay: '25' },
  { viewport: '844x390', delay: '50' },
]

function run(stage, attempt) {
  const profile = profiles[attempt % profiles.length]
  const logfile = `${directory}${stage}-${attempt + 1}.log`
  const log = createWriteStream(logfile)
  let pending = '',
    result
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scripts[stage]], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        BROWSER_ARTIFACTS_DIR: directory,
        PLAYTHROUGH_VIEWPORT: profile.viewport,
        PLAYTHROUGH_CONTROL_DELAY_MS: profile.delay,
        PLAYTHROUGH_RENDER_MODE:
          stage === 'boss' && attempt % 3 === 2 ? '3d' : '2d',
      },
    })
    child.stdout.on('data', (data) => {
      log.write(data)
      pending += data.toString()
      const lines = pending.split('\n')
      pending = lines.pop()
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          if (parsed.stage === stage) result = parsed
        } catch {
          /* Progress lines are preserved in the full log. */
        }
      }
    })
    child.stderr.on('data', (data) => log.write(data))
    child.once('error', (error) => {
      log.end()
      reject(error)
    })
    child.once('close', (code, signal) => {
      log.end()
      resolve({
        stage,
        attempt: attempt + 1,
        profile,
        exitCode: code,
        signal,
        logfile,
        result,
      })
    })
  })
}

const runs = []
let failed = false
for (let attempt = 0; attempt < attempts; attempt++) {
  for (const stage of stages) {
    const runResult = await run(stage, attempt)
    const { result } = runResult
    const first = runs.find((entry) => entry.stage === stage)?.result
    const expectedPhase = stage === 'boss' ? 'victory' : 'clear'
    const passed =
      runResult.exitCode === 0 &&
      result?.status === expectedPhase &&
      result.deaths === 0 &&
      result.errors.length === 0 &&
      (!first || first.traceHash === result.traceHash)
    runs.push({ ...runResult, passed })
    failed ||= !passed
    writeFileSync(
      directory + 'results.json',
      JSON.stringify({ passed: !failed, runs }, null, 2),
    )
    console.log(
      JSON.stringify({
        stage,
        attempt: attempt + 1,
        passed,
        profile: runResult.profile,
        ...result,
      }),
    )
  }
}
if (failed) process.exitCode = 1
console.log(
  JSON.stringify({
    passed: !failed,
    runs: runs.length,
    report: directory + 'results.json',
  }),
)
