import { loadFixture } from './fixtures.mjs'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { browserOutputDirectory } from '../browser-test.mjs'
import { openPlaythrough, readGame } from './driver.mjs'
import { createCanyonPilot } from './canyon-pilot.mjs'
import { createCoralPilot } from './coral-pilot.mjs'
import { createBossPilot } from './boss-pilot.mjs'

const stages = { canyon: 1, coral: 3, boss: 6 }
const serialize = (_, value) =>
  value instanceof Set
    ? { $set: [...value] }
    : value instanceof Map
      ? { $map: [...value] }
      : value

async function createPilot(name, runtime) {
  const { Game, emptyInput, vite } = runtime
  if (name === 'canyon') {
    const rulesPath =
      process.env.CANYON_RULES ||
      fileURLToPath(
        new URL(
          '../../../reference/canyon-playthrough-rules.json',
          import.meta.url,
        ),
      )
    const rules = JSON.parse(readFileSync(rulesPath, 'utf8'))
    if (!Array.isArray(rules))
      throw new Error('Canyon route rules must be an array')
    return createCanyonPilot(Game, emptyInput, rules)
  }
  if (name === 'boss') return createBossPilot(Game, emptyInput)
  const geometry = Object.assign(
    {},
    await vite.ssrLoadModule('/src/game/terrainSolids.ts'),
    await vite.ssrLoadModule('/src/game/animals.ts'),
    await vite.ssrLoadModule('/src/game/enemies.ts'),
    await vite.ssrLoadModule('/src/game/marineScale.ts'),
  )
  return createCoralPilot(Game, emptyInput, geometry)
}

async function play(name, runtime, directory) {
  const { driver } = runtime
  const mode =
    name === 'boss' ? process.env.PLAYTHROUGH_RENDER_MODE || '2d' : '3d'
  let state = await driver.start(runtime.url, stages[name], mode)
  const fixture = loadFixture(name)
  const planning =
    process.env.PLAYTHROUGH_REPLAN === '1' ||
    Boolean(process.env.CANYON_RULES && name === 'canyon')
  const choose = planning ? await createPilot(name, runtime) : null
  const inputs = []
  let bestX = state.player.x,
    progressAt = state.time
  const frames = name === 'boss' ? 8 : 6
  const limit = planning ? 1800 : fixture.steps.length
  for (let step = 0; step < limit && state.phase === 'playing'; step++) {
    const action = planning
      ? choose(state, driver.held, step)
      : fixture.steps[step].keys
    const groupFrames = planning ? frames : fixture.steps[step].frames
    const entry = {
      step,
      frames: groupFrames,
      time: state.time,
      x: state.player.x,
      y: state.player.y,
      hp: state.player.hp,
      lives: state.lives,
      cannon: state.player.cannon,
      mount: state.player.mount,
      hits: state.bossBattle?.hits,
      bossPhase: state.bossBattle?.phase,
      keys: action,
    }
    inputs.push(entry)
    if (step % 30 === 0) console.log(JSON.stringify(entry))
    state = await driver.advance(action, groupFrames)
    if (driver.deaths > 0) break
    if (state.player.x > bestX + 0.25) {
      bestX = state.player.x
      progressAt = state.time
    }
    if (name === 'canyon' && state.time - progressAt > 30)
      throw new Error(
        `No route progress for 30 game seconds at x=${state.player.x}`,
      )
    if (step % 30 === 0)
      writeFileSync(directory + 'inputs.json', JSON.stringify(inputs, null, 2))
  }
  writeFileSync(
    directory + 'final-state.json',
    JSON.stringify(state, serialize, 2),
  )
  if (!planning && state.phase !== fixture.expectedPhase) {
    throw new Error(
      `Fixture failed to finish ${name}: expected ${fixture.expectedPhase}, got ${state.phase}`,
    )
  }
  await driver.setKeys([])
  await driver.screenshot(directory + 'final.png')
  writeFileSync(directory + 'inputs.json', JSON.stringify(inputs, null, 2))
  return {
    status:
      state.phase === 'clear' || state.phase === 'victory'
        ? state.phase
        : 'incomplete',
    phase: state.phase,
    deaths: driver.deaths,
    x: state.player.x,
    y: state.player.y,
    lives: state.lives,
    hp: state.player.hp,
    time: state.time,
    hits: state.bossBattle?.hits,
    steps: inputs.length,
    verifiedTransitions: driver.transitions,
    mode,
    controlSource: planning ? 'planner' : 'validated-input-fixture',
    frameGroup: frames,
    physicsFrames: Math.round(state.time * 60),
    traceHash: createHash('sha256')
      .update(JSON.stringify(inputs))
      .digest('hex'),
  }
}

export async function runPlaythrough(name) {
  const base = browserOutputDirectory()
  const directory = `${base}runs/${name}-${new Date().toISOString().replaceAll(':', '-')}-${process.pid}/`
  mkdirSync(directory, { recursive: true })
  let runtime, summary
  try {
    runtime = await openPlaythrough()
    summary = await play(name, runtime, directory)
    if (runtime.errors.length)
      throw new Error(`Browser errors: ${runtime.errors.join('; ')}`)
  } catch (error) {
    summary = {
      status: 'error',
      error: error.message,
      deaths: runtime?.driver.deaths ?? 0,
    }
    writeFileSync(directory + 'error.log', error.stack || String(error))
    if (runtime) {
      const state = await readGame(runtime.page).catch(() => null)
      if (state)
        writeFileSync(
          directory + 'failure-state.json',
          JSON.stringify(state, serialize, 2),
        )
      await runtime.driver.screenshot(directory + 'failure.png').catch(() => {})
    }
  } finally {
    await runtime?.close()
  }
  summary = {
    stage: name,
    ...summary,
    inputOnly: true,
    liveStateWrites: false,
    enemyDamageEnabled: true,
    browserClockControlled: true,
    artifacts: directory,
    errors: runtime?.errors ?? [],
  }
  writeFileSync(directory + 'result.json', JSON.stringify(summary, null, 2))
  writeFileSync(
    `${base}${name}-playthrough.json`,
    JSON.stringify(summary, null, 2),
  )
  if (
    !['clear', 'victory'].includes(summary.status) ||
    summary.deaths ||
    summary.errors.length
  )
    process.exitCode = 1
  console.log(JSON.stringify(summary))
  return summary
}
