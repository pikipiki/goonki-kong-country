import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { launchGameBrowser } from '../browser-test.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const keyCodes = {
  right: 'ArrowRight',
  left: 'ArrowLeft',
  up: 'ArrowUp',
  down: 'ArrowDown',
  jump: 'Space',
  action: 'KeyX',
  run: 'ShiftLeft',
  swap: 'KeyC',
}
const frameSeconds = 1 / 60
const tolerance = 1e-8

export function packGame(game) {
  return Object.fromEntries(
    Object.entries(game).filter(([, value]) => typeof value !== 'function'),
  )
}

export function offlineGame(Game, state) {
  return Object.assign(
    Object.create(Game.prototype),
    structuredClone(packGame(state)),
    {
      onEvent: () => {},
      onSave: () => {},
    },
  )
}

export function inputTransition(emptyInput, previous, next) {
  const input = emptyInput()
  input.held = new Set(next)
  input.pressed = new Set(next.filter((key) => !previous.includes(key)))
  input.released = new Set(previous.filter((key) => !next.includes(key)))
  return input
}

export async function readGame(page) {
  const serialized = await page.evaluate(() =>
    JSON.stringify(
      {
        ...Object.fromEntries(
          Object.entries(window.goonk).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ),
        stageFinish: window.goonk.level.finishZone,
      },
      (_, value) =>
        value instanceof Set
          ? { $set: [...value] }
          : value instanceof Map
            ? { $map: [...value] }
            : value,
    ),
  )
  return JSON.parse(serialized, (_, value) => {
    if (value && typeof value === 'object' && '$set' in value)
      return new Set(value.$set)
    if (value && typeof value === 'object' && '$map' in value)
      return new Map(value.$map)
    return value
  })
}

/** Compare gameplay, not renderer-owned camera bounds or cosmetic particles. */
export function assertPrediction(expected, actual) {
  assert.equal(
    actual.phase,
    expected.phase,
    'phase diverged from the predicted input',
  )
  assert.equal(
    actual.lives,
    expected.lives,
    'lives diverged from the predicted input',
  )
  assert.ok(
    Math.abs(actual.time - expected.time) < tolerance,
    `physics clock drift: ${actual.time} != ${expected.time}`,
  )
  for (const key of ['x', 'y', 'vx', 'vy', 'hp', 'active', 'cannon', 'mount']) {
    assert.ok(
      Math.abs(actual.player[key] - expected.player[key]) < tolerance,
      `player.${key} diverged: ${actual.player[key]} != ${expected.player[key]}`,
    )
  }
  assert.deepEqual(
    actual.bossBattle,
    expected.bossBattle,
    'boss phase diverged',
  )
  assert.equal(actual.enemies.length, expected.enemies.length)
  for (let index = 0; index < expected.enemies.length; index++) {
    const predicted = expected.enemies[index],
      observed = actual.enemies[index]
    assert.equal(
      observed.alive,
      predicted.alive,
      `enemy ${index} life diverged`,
    )
    for (const key of ['x', 'y', 'hp']) {
      assert.ok(
        Math.abs(observed[key] - predicted[key]) < tolerance,
        `enemy ${index}.${key} diverged: ${observed[key]} != ${predicted[key]}`,
      )
    }
  }
}

export class PlaythroughDriver {
  held = []
  transitions = 0
  deaths = 0
  constructor(page, Game, emptyInput) {
    this.page = page
    this.Game = Game
    this.emptyInput = emptyInput
  }

  async pumpUntil(predicate, description, limit = 600) {
    for (let attempt = 0; attempt < limit; attempt++) {
      if (await predicate()) return
      await this.page.clock.runFor(16)
    }
    throw new Error(`Renderer did not become ready: ${description}`)
  }

  async clickVisible(locator) {
    await this.pumpUntil(() => locator.isVisible(), 'navigation control')
    assert.ok(await locator.isEnabled(), 'navigation control is disabled')
    // Actionability's animation-frame check cannot run while the clock is stopped.
    // Visibility/enabled checks still apply; dispatch a real pointer event.
    await locator.click({ force: true })
  }

  async start(url, stage, mode = '3d') {
    const epoch = new Date('2026-01-01T00:00:00Z')
    await this.page.clock.install({ time: epoch })
    await this.page.goto(url)
    await this.page.waitForFunction(() => Boolean(window.goonkScene))
    await this.page.clock.pauseAt(new Date('2026-01-01T02:00:00Z'))
    await this.clickVisible(
      this.page.getByRole('button', {
        name: /Explorer l’île|Explorer la carte|Carte de l’île|Explore the island/,
      }),
    )
    await this.pumpUntil(
      async () => (await this.page.locator('.map-stage').count()) >= 7,
      'island map',
    )
    await this.page.clock.runFor(64)
    await this.clickVisible(this.page.locator('.map-stage').nth(stage))
    await this.pumpUntil(
      async () =>
        (await this.page
          .locator('.map-stage')
          .nth(stage)
          .getAttribute('aria-pressed')) === 'true',
      'stage selection',
    )
    if (mode === '2d')
      await this.clickVisible(
        this.page.getByRole('button', { name: '2D', exact: true }),
      )
    await this.clickVisible(this.page.locator('.map-enter'))
    assert.equal((await readGame(this.page)).levelId, stage)
    // Boot lazy scene assets while the real pause control protects the fresh run.
    await this.page.keyboard.press('KeyP')
    await this.pumpUntil(
      async () => (await this.page.locator('canvas').count()) > 0,
      'stage canvas',
    )
    await this.page.clock.runFor(1000)
    const initial = await readGame(this.page)
    assert.equal(initial.phase, 'paused')
    assert.equal(initial.time, 0, 'stage advanced before its first input')
    await this.page.keyboard.press('KeyP')
    return readGame(this.page)
  }

  async setKeys(next) {
    for (const key of this.held.filter((key) => !next.includes(key)))
      await this.page.keyboard.up(keyCodes[key])
    for (const key of next.filter((key) => !this.held.includes(key))) {
      assert.ok(keyCodes[key], `Unknown gameplay key: ${key}`)
      await this.page.keyboard.down(keyCodes[key])
    }
    this.held = [...next]
  }

  async advance(next, frames = 6) {
    const before = await readGame(this.page)
    assert.equal(
      before.phase,
      'playing',
      'cannot send controls to a stopped stage',
    )
    const predicted = offlineGame(this.Game, before)
    const input = inputTransition(this.emptyInput, this.held, next)
    for (let frame = 0; frame < frames; frame++) predicted.update(input)
    await this.setKeys(next)
    const controlDelay = Number(process.env.PLAYTHROUGH_CONTROL_DELAY_MS || 0)
    if (controlDelay > 0) await delay(controlDelay)
    const target = before.time + frames * frameSeconds
    let after = before
    let previousLives = before.lives
    for (let count = 0; count < frames * 3 + 30; count++) {
      await this.page.clock.runFor(16)
      after = await readGame(this.page)
      this.deaths += Math.max(0, previousLives - after.lives)
      previousLives = after.lives
      if (after.phase !== 'playing' || after.time + tolerance >= target) break
    }
    assertPrediction(predicted, after)
    this.transitions++
    return after
  }

  async screenshot(path) {
    // Disable caret/animations in captures, without allowing gameplay time to advance.
    await this.page.screenshot({ path, animations: 'disabled' })
  }
}

/** One source tree for the live server and offline predictor; never reuse a user's server implicitly. */
export async function openPlaythrough() {
  const externalUrl = process.env.GAME_URL
  const vite = await createServer({
    root: process.env.GAME_ROOT || root,
    appType: externalUrl ? 'custom' : 'spa',
    logLevel: 'error',
    server: externalUrl
      ? { middlewareMode: true, hmr: false }
      : { host: '127.0.0.1', port: 0, hmr: false, open: false },
  })
  let browser
  try {
    if (!externalUrl) await vite.listen()
    const address = vite.httpServer?.address()
    const url = externalUrl || `http://127.0.0.1:${address.port}/`
    const { Game, emptyInput } = await vite.ssrLoadModule('/src/game/engine.ts')
    browser = await launchGameBrowser()
    const dimensions = (process.env.PLAYTHROUGH_VIEWPORT || '1100x700')
      .split('x')
      .map(Number)
    assert.ok(
      dimensions.length === 2 &&
        dimensions.every(
          (value) => Number.isInteger(value) && value > 0 && value <= 8192,
        ),
      'Invalid PLAYTHROUGH_VIEWPORT',
    )
    const page = await browser.newPage({
      viewport: { width: dimensions[0], height: dimensions[1] },
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    return {
      page,
      url,
      vite,
      Game,
      emptyInput,
      errors,
      driver: new PlaythroughDriver(page, Game, emptyInput),
      close: async () => {
        await browser.close()
        await vite.close()
      },
    }
  } catch (error) {
    await browser?.close()
    await vite.close()
    throw error
  }
}
