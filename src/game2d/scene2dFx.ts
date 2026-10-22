import type { Game } from '../game/engine'
import type { Enemy } from '../game/engine/types'
import type { TransientFx } from './scene2dConstants'
import { pick } from '../utils/pick'

export type Scene2dFxState = {
  fxList: TransientFx[]
  prevEnemyAlive: Map<number, boolean>
  prevUsedBarrels: Set<number>
  prevBrokenWalls: Set<number>
  prevRevealedCaches: Set<number>
  prevCrateState: string
  prevGrounded: boolean
}

export function createScene2dFxState(): Scene2dFxState {
  return {
    fxList: [],
    prevEnemyAlive: new Map(),
    prevUsedBarrels: new Set(),
    prevBrokenWalls: new Set(),
    prevRevealedCaches: new Set(),
    prevCrateState: 'crate',
    prevGrounded: true,
  }
}

export function resetScene2dFxState(state: Scene2dFxState) {
  state.fxList.length = 0
  state.prevEnemyAlive.clear()
  state.prevUsedBarrels.clear()
  state.prevBrokenWalls.clear()
  state.prevRevealedCaches.clear()
}

type ToPixel = (worldX: number, worldY: number) => { px: number; py: number }

function enemyDeathFxGroup(enemy: Enemy) {
  if (enemy.kind === 'beetle') {
    return 'gnawty_hurt'
  }

  if (enemy.kind === 'armored') {
    return 'klump_hurt'
  }

  if (enemy.pattern === 'necky') {
    return 'necky_hurt'
  }

  return 'kritter_hurt'
}

function pushSmokePuff(
  fxList: TransientFx[],
  pixelX: number,
  pixelY: number,
  fps: number,
  duration: number,
) {
  fxList.push({
    x: pixelX,
    y: pixelY,
    vx: 0,
    vy: 0,
    gravity: 0,
    group: 'smoke_puff',
    fps,
    age: 0,
    duration,
    flipX: false,
  })
}

function syncEnemyDeathFx(game: Game, state: Scene2dFxState, toPixel: ToPixel) {
  game.enemies.forEach((enemy, index) => {
    const wasAlive = state.prevEnemyAlive.get(index) ?? true

    if (wasAlive && !enemy.alive) {
      const { px, py } = toPixel(enemy.x, enemy.y)

      state.fxList.push({
        x: px,
        y: py - 8,
        vx: pick(enemy.vx >= 0, 1, -1) * 35,
        vy: -130,
        gravity: 380,
        group: enemyDeathFxGroup(enemy),
        fps: 10,
        age: 0,
        duration: 1.1,
        flipX: enemy.vx < 0,
      })
      pushSmokePuff(state.fxList, px, py - 12, 16, 0.5)
    }

    state.prevEnemyAlive.set(index, enemy.alive)
  })
}

function syncBarrelFx(game: Game, state: Scene2dFxState, toPixel: ToPixel) {
  game.usedBarrels.forEach((barrelIdx) => {
    if (state.prevUsedBarrels.has(barrelIdx)) {
      return
    }

    state.prevUsedBarrels.add(barrelIdx)
    const barrel = game.level.barrels.at(barrelIdx)

    if (barrel === undefined) {
      return
    }

    const { px, py } = toPixel(barrel.x, barrel.y)

    if (barrel.kind === 'checkpoint') {
      state.fxList.push({
        x: px,
        y: py - 14,
        vx: 0,
        vy: 0,
        gravity: 0,
        group: 'checkpoint_stars',
        fps: 15,
        age: 0,
        duration: 1.0,
        flipX: false,
      })
      return
    }

    if (barrel.kind === 'rescue') {
      state.fxList.push({
        x: px,
        y: py - 12,
        vx: 0,
        vy: 0,
        gravity: 0,
        group: 'barrel_break',
        fps: 14,
        age: 0,
        duration: 0.55,
        flipX: false,
      })
      state.fxList.push({
        x: px,
        y: py - 14,
        vx: 0,
        vy: 0,
        gravity: 0,
        group: 'burst_effect',
        fps: 18,
        age: 0,
        duration: 0.65,
        flipX: false,
      })
    }
  })
}

function syncWorldRevealFx(
  game: Game,
  state: Scene2dFxState,
  toPixel: ToPixel,
) {
  game.brokenWalls.forEach((wallIdx) => {
    if (state.prevBrokenWalls.has(wallIdx)) {
      return
    }

    state.prevBrokenWalls.add(wallIdx)
    const wall = game.level.breakableWalls?.[wallIdx]

    if (!wall) {
      return
    }

    const { px, py } = toPixel(wall.x, wall.y + wall.h * 0.4)

    pushSmokePuff(state.fxList, px, py, 15, 0.55)
  })

  game.revealedCaches.forEach((cacheIdx) => {
    if (state.prevRevealedCaches.has(cacheIdx)) {
      return
    }

    state.prevRevealedCaches.add(cacheIdx)
    const cache = game.level.itemCaches?.[cacheIdx]

    if (!cache) {
      return
    }

    const { px, py } = toPixel(cache.x, cache.y)

    pushSmokePuff(state.fxList, px, py - 6, 16, 0.5)
  })
}

function syncMountAndLandFx(
  game: Game,
  state: Scene2dFxState,
  toPixel: ToPixel,
) {
  const rambi = game.animals.at(0)

  if (rambi && state.prevCrateState === 'crate' && rambi.state !== 'crate') {
    const { px, py } = toPixel(rambi.x, rambi.y)

    state.fxList.push({
      x: px,
      y: py - 12,
      vx: 0,
      vy: 0,
      gravity: 0,
      group: 'rambi_box',
      fps: 8,
      age: 0.13,
      duration: 0.4,
      flipX: false,
    })
  }

  if (rambi) {
    state.prevCrateState = rambi.state
  }

  if (
    !state.prevGrounded &&
    game.player.grounded &&
    Math.abs(game.player.vx) > 2
  ) {
    const { px, py } = toPixel(game.player.x, game.player.y)

    pushSmokePuff(state.fxList, px, py - 2, 18, 0.4)
  }

  state.prevGrounded = game.player.grounded
}

function tickScene2dFxList(fxList: TransientFx[], deltaTime: number) {
  for (let index = fxList.length - 1; index >= 0; index--) {
    const effect = fxList[index]

    effect.age += deltaTime
    effect.x += effect.vx * deltaTime
    effect.y += effect.vy * deltaTime
    effect.vy += effect.gravity * deltaTime

    if (effect.age >= effect.duration) {
      fxList.splice(index, 1)
    }
  }
}

export function syncAndTickScene2dFx(
  game: Game,
  state: Scene2dFxState,
  toPixel: ToPixel,
  deltaTime: number,
) {
  syncEnemyDeathFx(game, state, toPixel)
  syncBarrelFx(game, state, toPixel)
  syncWorldRevealFx(game, state, toPixel)
  syncMountAndLandFx(game, state, toPixel)
  tickScene2dFxList(state.fxList, deltaTime)
}
