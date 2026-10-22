// Real keyboard playthrough: no writes to game state, no disabled enemies, no teleports.
import { createServer } from 'vite'
import {
  launchGameBrowser,
  browserOutputDirectory,
} from './lib/browser-test.mjs'
import fs from 'node:fs/promises'
const output = browserOutputDirectory()
const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
const { Game, emptyInput } = await vite.ssrLoadModule('/src/game/engine.ts')
const { coralBodyBlocked, resolveCoralMotion, SWIM_BODY } =
  await vite.ssrLoadModule('/src/game/terrainSolids.ts')
const { ENGUARDE_SWIM_BODY, ANIMAL_DESIGNS } = await vite.ssrLoadModule(
  '/src/game/animals.ts',
)
const { ENEMY_DESIGNS } = await vite.ssrLoadModule('/src/game/enemies.ts')
const { CORAL_WORLD_WIDTH, CORAL_WATER_FLOOR_Y, CORAL_WATER_SURFACE_Y } =
  await vite.ssrLoadModule('/src/game/marineScale.ts')
await vite.close()
const browser = await launchGameBrowser()
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } }),
  log = [],
  events = [],
  errors = []
page.on('pageerror', (e) => errors.push(e.message))
const held = new Set()
async function keys(next) {
  for (const key of [...held])
    if (!next.includes(key)) {
      await page.keyboard.up(key)
      held.delete(key)
    }
  for (const key of next)
    if (!held.has(key)) {
      await page.keyboard.down(key)
      held.add(key)
    }
}
const pack = (game) =>
  Object.fromEntries(
    Object.entries(game).filter(([, value]) => typeof value !== 'function'),
  )
const revive = (_, value) =>
  value && typeof value === 'object' && '$set' in value
    ? new Set(value.$set)
    : value && typeof value === 'object' && '$map' in value
      ? new Map(value.$map)
      : value
const serialize = (_, value) =>
  value instanceof Set
    ? { $set: [...value] }
    : value instanceof Map
      ? { $map: [...value] }
      : value
async function state() {
  return JSON.parse(
    await page.evaluate(() =>
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
    ),
    revive,
  )
}
function findRoute(s, target, body, avoid = true) {
  const grid = 0.5,
    sx = Math.round(s.player.x * 2) / 2,
    sy = Math.round(s.player.y * 2) / 2
  const start = { x: sx, y: sy, parent: -1, cost: 0 },
    nodes = [start],
    seen = new Map([[`${sx},${sy}`, 0]]),
    queue = [0]
  let goal = -1
  // A* with a soft cost for enemies' current swim volume; hazards stay active.
  while (queue.length) {
    let best = 0
    for (let k = 1; k < queue.length; k++)
      if (nodes[queue[k]].score < nodes[queue[best]].score) best = k
    const index = queue.splice(best, 1)[0],
      n = nodes[index]
    if (
      Math.abs(n.x - target.x) < target.w / 2 - 0.2 &&
      n.y >= target.y + 0.1 &&
      n.y <= target.y + target.h - 0.1
    ) {
      goal = index
      break
    }
    for (const [dx, dy] of [
      [grid, 0],
      [-grid, 0],
      [0, grid],
      [0, -grid],
    ]) {
      const x = n.x + dx,
        y = n.y + dy,
        key = `${x},${y}`
      if (
        x < 0.5 ||
        x > CORAL_WORLD_WIDTH - 0.5 ||
        y < CORAL_WATER_FLOOR_Y + 0.1 ||
        y > CORAL_WATER_SURFACE_Y - 0.5 ||
        coralBodyBlocked(x, y, body)
      )
        continue
      const motion = resolveCoralMotion(n.x, n.y, x, y, body)
      if (Math.abs(motion.x - x) > 0.001 || Math.abs(motion.y - y) > 0.001)
        continue
      let risk = 0
      if (avoid)
        for (const e of s.enemies) {
          const d = Math.hypot((x - e.x) * 0.9, y + 0.4 - e.y - 0.6)
          if (d < 3) risk += (3 - d) * 6
        }
      const cost = n.cost + grid + risk,
        old = seen.get(key)
      if (old !== undefined && nodes[old].cost <= cost) continue
      const node = {
        x,
        y,
        parent: index,
        cost,
        score: cost + Math.abs(x - target.x) + Math.abs(y - target.y),
      }
      const i = nodes.push(node) - 1
      seen.set(key, i)
      queue.push(i)
    }
  }
  if (goal < 0) return null
  const route = []
  for (let i = goal; i >= 0; i = nodes[i].parent)
    route.push({ x: nodes[i].x, y: nodes[i].y })
  route.reverse()
  return route
}
function steering(state, target) {
  const choices = [
    [],
    ['ArrowLeft'],
    ['ArrowRight'],
    ['ArrowUp'],
    ['ArrowDown'],
    ['ArrowLeft', 'ArrowUp'],
    ['ArrowRight', 'ArrowUp'],
    ['ArrowLeft', 'ArrowDown'],
    ['ArrowRight', 'ArrowDown'],
  ]
  if (state.player.mount >= 0)
    choices.push(['ArrowLeft', 'Space'], ['ArrowRight', 'Space'])
  const keyMap = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Space: 'jump',
  }
  let beam = [{ state, held: [...held], path: [], score: 0 }]
  for (let depth = 0; depth < 5; depth++) {
    const candidates = []
    for (const node of beam)
      for (const choice of choices) {
        const game = Object.assign(
          Object.create(Game.prototype),
          structuredClone(node.state),
          { phase: 'playing', onEvent: () => {}, onSave: () => {} },
        )
        const input = emptyInput()
        for (const key of choice) {
          input.held.add(keyMap[key])
          if (!node.held.includes(key)) input.pressed.add(keyMap[key])
        }
        for (const key of node.held)
          if (!choice.includes(key)) input.released.add(keyMap[key])
        let danger = 0
        for (let frame = 0; frame < 6; frame++) {
          game.update(input)
          const player = game.player
          const bodyHeight =
              player.mount >= 0 ? ENGUARDE_SWIM_BODY.height : 0.95,
            bodyWidth = player.mount >= 0 ? ANIMAL_DESIGNS.enguarde.width : 0.3
          let risk = 0
          for (const enemy of game.enemies.filter((enemy) => enemy.alive)) {
            if (
              player.mount >= 0 &&
              player.mountAttack > 0 &&
              player.facing * (enemy.x - player.x) > -0.2
            )
              continue
            const design = ENEMY_DESIGNS[enemy.kind],
              gapX = Math.abs(player.x - enemy.x) - design.width - bodyWidth
            const gapY = Math.max(
              enemy.y - player.y - bodyHeight,
              player.y - enemy.y - design.height,
            )
            risk += Math.max(0, 1 - Math.max(gapX, gapY)) * 12
          }
          danger = Math.max(danger, risk)
        }
        const player = game.player
        let score =
          Math.hypot(player.x - target.x, player.y - target.y) * 8 + danger
        score +=
          (state.player.hp - player.hp) * 10000 +
          (state.lives - game.lives) * 100000
        if (state.player.mount >= 0 && player.mount < 0) score += 1000
        if (game.phase === 'clear') score -= 1000000
        candidates.push({
          state: pack(game),
          held: choice,
          path: [...node.path, choice],
          score,
        })
      }
    const seen = new Set()
    beam = candidates
      .sort((left, right) => left.score - right.score)
      .filter((node) => {
        const player = node.state.player,
          key = [
            Math.round(player.x * 10),
            Math.round(player.y * 10),
            Math.round(player.vx),
            Math.round(player.vy),
            player.hp,
            player.mount,
            node.held.join(','),
          ].join(':')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 10)
  }
  return beam[0]?.path[0] || []
}
// Follow the dense collision-checked route, aiming ahead along clear water.
// Requiring a .22-unit stop at every compressed corner caused oscillation,
// especially on Enguarde and on slower browser frames.
function clearSegment(player, target, body) {
  const distance = Math.hypot(target.x - player.x, target.y - player.y),
    steps = Math.max(1, Math.ceil(distance / 0.2))
  for (let step = 1; step <= steps; step++) {
    const mix = step / steps,
      x = player.x + (target.x - player.x) * mix,
      y = player.y + (target.y - player.y) * mix
    if (coralBodyBlocked(x, y, body)) return false
  }
  return true
}
function followRoute(route, player, body) {
  let furthest = -1
  for (let index = 0; index < Math.min(route.length, 40); index++) {
    if (
      Math.hypot(route[index].x - player.x, route[index].y - player.y) <= 4 &&
      clearSegment(player, route[index], body)
    )
      furthest = index
  }
  if (furthest > 0) route.splice(0, furthest)
  if (
    route.length === 1 &&
    Math.hypot(route[0].x - player.x, route[0].y - player.y) < 0.4
  )
    route.shift()
  return route[0]
}
function plan(state, target, body) {
  return findRoute(state, target, body) || []
}
// The app ignores gameplay keydown while paused: resume BEFORE sending inputs.
async function advanceControls(next, time, openCrate = false) {
  await page.keyboard.press('KeyP')
  await keys(next)
  if (openCrate) await page.keyboard.press('KeyX')
  await page.waitForFunction(
    (target) => window.goonk.time >= target || window.goonk.phase !== 'playing',
    time + 6 / 60,
  )
}
let previousLives = 5,
  deaths = 0,
  lastSnapshot = 0,
  route = [],
  target = null,
  targetKind = 'exit',
  stuck = 0,
  lastXY = null
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174/')
  await page.waitForFunction(() => !!window.goonk)
  await page
    .getByRole('button', { name: /Explorer l’île|Explore the island/ })
    .click()
  await page.locator('.map-stage').nth(3).click()
  await page.locator('.map-enter').click()
  await page.waitForFunction(
    () => window.goonk.phase === 'playing' && window.goonk.levelId === 3,
  )
  const first = await state()
  log.push({ type: 'start', ...first })
  previousLives = first.lives
  await fs.writeFile(
    output + 'coral-playthrough-start.json',
    JSON.stringify(first, null, 2),
  )
  for (let tick = 0; tick < 1800; tick++) {
    let s = await state()
    if (s.lives < previousLives) {
      deaths += previousLives - s.lives
      events.push({ type: 'death', tick, ...s })
    }
    previousLives = s.lives
    if (tick % 10 === 0) {
      log.push({
        tick,
        time: s.time,
        lives: s.lives,
        hp: s.player.hp,
        x: s.player.x,
        y: s.player.y,
        mount: s.player.mount,
        enemyCount: s.enemies.filter((enemy) => enemy.alive).length,
        keys: [...held],
      })
      console.log(JSON.stringify(log.at(-1)))
    }
    if (s.phase === 'clear') {
      await keys([])
      await page.screenshot({ path: output + 'coral-playthrough-complete.png' })
      log.push({ type: 'complete', deaths, ...s })
      break
    }
    if (s.phase !== 'playing' || deaths) {
      await keys([])
      await page.screenshot({ path: output + 'coral-playthrough-blocked.png' })
      log.push({ type: 'blocked', deaths, ...s })
      break
    }
    await keys([])
    await page.keyboard.press('KeyP')
    await page.waitForFunction(
      () => window.goonk.phase === 'paused' || window.goonk.phase === 'clear',
    )
    s = await state()
    if (s.phase === 'clear') break
    const p = s.player,
      body = p.mount >= 0 ? ENGUARDE_SWIM_BODY : SWIM_BODY
    if (!target || (targetKind === 'animal' && p.mount >= 0)) {
      target = s.stageFinish
      targetKind = 'exit'
      route = []
      if (p.mount < 0) {
        let best = null
        for (const animal of s.animals.filter(
          (a) => a.state === 'crate' || a.state === 'idle',
        )) {
          const zone = { x: animal.x, y: animal.y - 0.3, w: 1.7, h: 1.3 },
            candidate = findRoute(s, zone, body)
          if (candidate && (!best || candidate.length < best.route.length))
            best = { zone, route: candidate }
        }
        if (best) {
          target = best.zone
          route = best.route
          targetKind = 'animal'
        }
      }
    }
    if (!route.length) route = await plan(s, target, body)
    const next = followRoute(route, p, body)
    const animal = s.animals.find(
      (a) =>
        a.state === 'crate' &&
        Math.abs(a.x - p.x) < 1.6 &&
        Math.abs(a.y - p.y) < 1.7,
    )
    const openCrate = !!animal && tick % 4 === 0
    if (openCrate) events.push({ type: 'crate-action', x: p.x, y: p.y })
    if (!next) {
      if (targetKind === 'animal' && p.mount < 0) target = null
      await advanceControls([], s.time, openCrate)
      continue
    }
    const pressed = steering(s, next)
    if (lastXY && Math.hypot(p.x - lastXY.x, p.y - lastXY.y) < 0.015) stuck++
    else stuck = 0
    if (stuck > 30) {
      events.push({ type: 'stuck', tick, x: p.x, y: p.y, next, toast: s.toast })
      route = []
      stuck = 0
      await page.screenshot({
        path: output + `coral-playthrough-stuck-${tick}.png`,
      })
    }
    lastXY = { x: p.x, y: p.y }
    await advanceControls(pressed, s.time, openCrate)
    if (s.time - lastSnapshot > 12) {
      lastSnapshot = s.time
      await page.screenshot({
        path: output + `coral-playthrough-${Math.floor(s.time)}s.png`,
      })
    }
  }
  await keys([])
  const final = await state()
  await fs.writeFile(
    output + 'coral-playthrough.json',
    JSON.stringify(
      {
        inputOnly: true,
        enemyDamageEnabled: true,
        liveStateWrites: false,
        deaths,
        final,
        log,
        events,
        errors,
      },
      serialize,
      2,
    ),
  )
  if (final.phase !== 'clear' || deaths || errors.length) process.exitCode = 1
  console.log(
    JSON.stringify({
      done: true,
      phase: final.phase,
      deaths,
      lives: final.lives,
      time: final.time,
      player: final.player,
      errors,
    }),
  )
} finally {
  await browser.close()
}
