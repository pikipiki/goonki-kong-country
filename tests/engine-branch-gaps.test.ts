import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import type { Enemy } from '../src/game/engine/types'
import type { Platform } from '../src/game/levels'
import { snapEnemyToSupport } from '../src/game/engine/gameGroundEnemy'
import { advanceLooseAnimal } from '../src/game/engine/gameMountAnimals'
import {
  cacheBananaEventName,
  updateItemCaches,
} from '../src/game/engine/gameWorldInteract'
import { runMineAndClock } from '../src/game/engine/playingFrame/stepMineAndClock'
import { runPlayerMotion } from '../src/game/engine/playingFrame/stepPlayerMotion'
import { runEnemies } from '../src/game/engine/playingFrame/stepEnemies'
import { runWorldInteract } from '../src/game/engine/playingFrame/stepWorldInteract'
import { fireJumpAfterDelay } from '../src/game/engine/fireJumpAfterDelay'
import { groundedJumpImpulse } from '../src/game/engine/groundedJumpImpulse'
import { STEP } from '../src/game/engine/romPhysics'
describe('engine branch gaps — fireJump and jump impulse', () => {
  it('covers fireJumpAfterDelay branches', () => {
    expect(fireJumpAfterDelay(1, 0, false)).toBe(false)
    expect(fireJumpAfterDelay(0, 0, false)).toBe(false)
    expect(fireJumpAfterDelay(0, 0.1, false)).toBe(true)
    expect(fireJumpAfterDelay(0, 0, true)).toBe(true)
  })

  it('covers jump delay expiry without coyote or roll jump', () => {
    const game = new Game()
    game.start(0)
    game.enemies = []
    Object.assign(game.player, {
      mount: -1,
      grounded: true,
      jumpDelay: 1,
      coyote: 0,
      rollJump: false,
    })
    const env = runMineAndClock(game, emptyInput(), STEP)
    runPlayerMotion(game, emptyInput(), STEP, env)
    expect(game.player.jumpDelay).toBe(0)
  })

  it('covers grounded jump impulse scaling', () => {
    const jungle = new Game()
    jungle.start(0)
    const jungleJump = groundedJumpImpulse(jungle, undefined)
    const ship = new Game()
    ship.start(6)
    const shipJump = groundedJumpImpulse(ship, undefined)
    expect(shipJump).toBeGreaterThan(jungleJump)
    const rambi = new Game()
    rambi.start(0)
    expect(groundedJumpImpulse(rambi, 9.5)).toBe(9.5)
  })
})

describe('engine branch gaps — snap and mounts', () => {
  it('covers snapEnemyToSupport landing guards', () => {
    const enemy = { y: 1, vy: 2 } as Enemy
    snapEnemyToSupport(enemy, null, 1, false)
    expect(enemy.y).toBe(1)
    snapEnemyToSupport(enemy, 2, 1, false)
    expect(enemy.y).toBe(1)
    snapEnemyToSupport(enemy, 2, 1.96, false)
    expect(enemy.y).toBe(2)
    expect(enemy.vy).toBe(0)
    const grounded = { y: 2, vy: 1 } as Enemy
    snapEnemyToSupport(grounded, 2, 0.5, true)
    expect(grounded.y).toBe(2)
  })

  it('covers fleeing mount in water without coral collision', () => {
    const game = new Game()
    game.start(3, true)
    Reflect.set(game.level, 'originalTerrain', 'jungle')
    const animal = game.animals[0]
    animal.state = 'fleeing'
    animal.vx = 0.4
    animal.timer = 0.2
    advanceLooseAnimal(game, animal, true, STEP)
    expect(animal.state).toBe('fleeing')
  })

  it('covers moving platform surface with default travel', () => {
    const game = new Game()
    game.start(0)
    const plat: Platform = {
      x: 12,
      y: 4,
      w: 2,
      h: 0.5,
      kind: 'moving' as const,
    }
    Reflect.deleteProperty(plat, 'travel')
    const yDefault = game.surface(plat)
    plat.travel = 2.25
    const yCustom = game.surface(plat)
    expect(yDefault).toBeTypeOf('number')
    expect(yCustom).toBeTypeOf('number')
  })
})

describe('engine branch gaps — caches and stomp', () => {
  it('covers cache banana helpers and rewards', () => {
    expect(cacheBananaEventName(1)).toBe('banana')
    expect(cacheBananaEventName(3)).toBe('banana-bunch')
    const cache = new Game()
    cache.start(0)
    cache.level.itemCaches = [{ x: 3, y: 0, reward: { kind: 'banana' } }]
    cache.revealedCaches.add(0)
    Object.assign(cache.player, { x: 3, y: -0.2, grounded: true })
    updateItemCaches(cache, cache.player, emptyInput())
    expect(cache.bananas).toBeGreaterThan(0)
  })

  it('covers mine recovery when runtime bees are absent', () => {
    const mine = new Game()
    mine.start(2, true)
    mine.mineRecoveryLayout = 0
    mine.enemies = mine.enemies.filter((entry) => entry.kind !== 'bee')
    runMineAndClock(mine, emptyInput(), STEP)
    expect(mine.mineRecoveryLayout).toBe(1)
  })

  it('covers stomp that leaves enemy alive and cannon auto hint', () => {
    const game = new Game()
    game.start(0, true)
    const victim = game.enemies.find(
      (entry2) => entry2.kind === 'beetle' && entry2.alive,
    )
    expect(victim).toBeDefined()
    if (!victim) {
      return
    }
    victim.hp = 2
    victim.hurt = 0
    game.thrown.push({
      x: victim.x,
      y: victim.y + 0.5,
      vx: 0,
      vy: 0,
      active: true,
    })
    const env = runMineAndClock(game, emptyInput(), STEP)
    env.oldY = game.player.y
    runEnemies(game, emptyInput(), STEP, env)
    expect(victim.hp).toBe(1)
    expect(victim.alive).toBe(true)
    const cannon = new Game()
    cannon.start(1)
    cannon.enemies = []
    const idx = cannon.level.barrels.findIndex(
      (barrel) => barrel.kind === 'cannon',
    )
    if (idx < 0) {
      return
    }
    cannon.level.barrels[idx].autoFire = true
    const pos = cannon.cannonPosition(idx)
    Object.assign(cannon.player, {
      x: pos.x,
      y: pos.y,
      mount: -1,
      cannonLock: -1,
      grounded: true,
    })
    runMineAndClock(cannon, emptyInput(), STEP)
    runWorldInteract(cannon, emptyInput(), STEP)
  })
})

function runBufferedJump(game: Game) {
  const env = runMineAndClock(game, emptyInput(), STEP)
  runPlayerMotion(game, emptyInput(), STEP, env)
  Object.assign(game.player, {
    jumpDelay: 0,
    buffer: 0.12,
    rollJump: true,
    coyote: 0.12,
    grounded: true,
  })
  runPlayerMotion(game, emptyInput(), STEP, env)
}

describe('engine branch gaps — jungle and ship jumps', () => {
  it('covers jumps without mount design on jungle and ship', () => {
    const jungle = new Game()
    jungle.start(0)
    jungle.enemies = []
    Object.assign(jungle.player, {
      mount: -1,
      grounded: true,
      jumpDelay: 1,
      coyote: 0.2,
      rollJump: true,
    })
    runBufferedJump(jungle)
    const ship = new Game()
    ship.start(6)
    ship.enemies = []
    Object.assign(ship.player, {
      mount: -1,
      grounded: true,
      jumpDelay: 1,
      coyote: 0.2,
      rollJump: true,
    })
    runBufferedJump(ship)
    expect(ship.player.grounded).toBe(false)
  })
})

describe('engine branch gaps — rambi and coyote jumps', () => {
  it('covers rambi mount jump delay branches', () => {
    const rambi = new Game()
    rambi.start(0)
    rambi.enemies = []
    rambi.animals[0].state = 'ridden'
    Object.assign(rambi.player, {
      mount: 0,
      grounded: true,
      jumpDelay: 1,
      coyote: 0.2,
      rollJump: true,
    })
    runBufferedJump(rambi)
    expect(rambi.player.mount).toBe(0)
  })

  it('covers no-jump and roll-only jump delay branches', () => {
    const noJump = new Game()
    noJump.start(0)
    noJump.enemies = []
    Object.assign(noJump.player, {
      mount: -1,
      grounded: true,
      jumpDelay: 1,
      coyote: 0,
      rollJump: false,
    })
    let env = runMineAndClock(noJump, emptyInput(), STEP)
    runPlayerMotion(noJump, emptyInput(), STEP, env)
    const rollOnly = new Game()
    rollOnly.start(0)
    rollOnly.enemies = []
    Object.assign(rollOnly.player, {
      mount: -1,
      grounded: true,
      jumpDelay: 1,
      coyote: 0,
      rollJump: true,
    })
    env = runMineAndClock(rollOnly, emptyInput(), STEP)
    runPlayerMotion(rollOnly, emptyInput(), STEP, env)
    expect(rollOnly.player.jumpDelay).toBeLessThan(1)
  })

  it('covers coyote-only jump delay branches', () => {
    const coyoteOnly = new Game()
    coyoteOnly.start(0)
    coyoteOnly.enemies = []
    Object.assign(coyoteOnly.player, {
      mount: -1,
      grounded: true,
      jumpDelay: 1,
      coyote: 0.2,
      rollJump: false,
    })
    const env = runMineAndClock(coyoteOnly, emptyInput(), STEP)
    runPlayerMotion(coyoteOnly, emptyInput(), STEP, env)
    Object.assign(coyoteOnly.player, {
      jumpDelay: 0,
      buffer: 0.12,
      rollJump: false,
      coyote: 0.12,
      grounded: true,
    })
    runPlayerMotion(coyoteOnly, emptyInput(), STEP, env)
    expect(coyoteOnly.player.jumpDelay).toBeGreaterThan(0)
  })
})

describe('engine branch gaps — nut versus barrel', () => {
  it('covers nut versus thrown barrel collision', () => {
    const clash = new Game()
    clash.start(0, true)
    clash.enemies = []
    clash.thrown = [{ x: 4, y: 2, vx: 0, vy: 0, active: true }]
    clash.enemyShots = [{ x: 4, y: 2, vx: 0, vy: 0, active: true }]
    runMineAndClock(clash, emptyInput(), STEP)
    runWorldInteract(clash, emptyInput(), STEP)
    expect(clash.enemyShots.every((state) => !state.active)).toBe(true)
    expect(clash.thrown.every((barrel2) => !barrel2.active)).toBe(true)
    const miss = new Game()
    miss.start(0, true)
    miss.enemies = []
    miss.thrown = [{ x: 4, y: 2, vx: 0, vy: 0, active: true }]
    miss.enemyShots = [{ x: 4, y: 2.7, vx: 0, vy: 0, active: true }]
    runMineAndClock(miss, emptyInput(), STEP)
    runWorldInteract(miss, emptyInput(), STEP)
    expect(miss.enemyShots[0].active).toBe(true)
  })
})
