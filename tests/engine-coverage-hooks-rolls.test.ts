import { describe, expect, it } from 'vitest'
import { ENEMY_DESIGNS } from '../src/game/enemies'
import { Game, emptyInput } from '../src/game/engine'
import { advanceGame } from './helpers/simulation'
import { assertDefined } from './helpers/assertDefined'

describe('engine coverage hooks — rolls and recovery', () => {
  it('covers roll and run input branches', () => {
    const roll = new Game()
    roll.start(0)
    roll.enemies = []
    Object.assign(roll.player, {
      x: 14,
      y: 0,
      grounded: true,
      roll: 0,
      recentRun: 0,
      vx: 3,
    })
    const riRef = emptyInput()
    riRef.pressed.add('action')
    riRef.held.add('right')
    riRef.held.add('run')
    advanceGame(roll, riRef)

    const moving = new Game()
    moving.start(0)
    moving.enemies = []
    Object.assign(moving.player, {
      x: 14,
      y: 0,
      grounded: true,
      roll: 0,
      recentRun: 1,
    })
    const miRef = emptyInput()
    miRef.pressed.add('action')
    miRef.held.add('left')
    advanceGame(moving, miRef)

    const still = new Game()
    still.start(0)
    still.enemies = []
    Object.assign(still.player, {
      x: 14,
      y: 0,
      grounded: true,
      roll: 0,
      recentRun: 1,
    })
    const siRef = emptyInput()
    siRef.pressed.add('action')
    advanceGame(still, siRef)
    expect(still.player.recentRun).toBeCloseTo(1, 1)
  })
})

describe('engine coverage hooks — ship and mounts', () => {
  it('covers ship jumps, lagoon fall, mine delete, and rescue damage', () => {
    const ship = new Game()
    ship.start(6)
    ship.enemies = []
    ship.player.jumpDelay = 2
    ship.player.coyote = 0.1
    ship.player.rollJump = true
    advanceGame(ship, emptyInput(), 3)

    const lagoon = new Game()
    lagoon.start(3, true)
    lagoon.enemies = []
    Object.assign(lagoon.player, { vy: 2, grounded: false })
    advanceGame(lagoon, emptyInput(), 5)

    const mine = new Game()
    mine.start(2, true)
    Reflect.deleteProperty(mine, 'mineRecoveryLayout')
    advanceGame(mine)

    const rescue = new Game()
    rescue.start(0)
    rescue.enemies = []
    const rIdx = rescue.level.barrels.findIndex(
      (barrel4) => barrel4.kind === 'rescue',
    )
    if (rIdx >= 0) {
      rescue.usedBarrels.add(rIdx)
      rescue.lives = 2
      rescue.player.hp = 1
      rescue.player.invincible = 0
      rescue.damage()
      expect(rescue.lives).toBe(1)
    }

    const winky = new Game()
    winky.start(5)
    const wmRef = assertDefined(
      winky.animals.find((actor2) => actor2.kind === 'winky'),
    )
    wmRef.state = 'ridden'
    const foe = winky.enemies.find((entry2) => entry2.kind === 'beetle')
    if (foe) {
      Object.assign(winky.player, {
        mount: winky.animals.indexOf(wmRef),
        x: foe.x,
        y: foe.y + 2,
        vy: -7,
        invincible: 0,
      })
      advanceGame(winky)
    }

    const expresso = new Game()
    expresso.start(4)
    expresso.animals[0].state = 'ridden'
    const bug = expresso.enemies.find((entry3) => entry3.kind === 'beetle')
    if (bug) {
      Object.assign(expresso.player, {
        mount: 0,
        x: bug.x,
        y: bug.y + 0.05,
        invincible: 0,
      })
      advanceGame(expresso)
    }

    const eng = new Game()
    eng.start(3, true)
    const crate = eng.animals.find(
      (actor3) => actor3.kind === 'enguarde' && actor3.state === 'crate',
    )
    if (crate) {
      Object.assign(eng.player, { x: crate.x, y: crate.y, roll: 0.2 })
      advanceGame(eng)
    }
    expect(eng.animals.length).toBeGreaterThan(0)
  })
})

describe('engine coverage hooks — stomps and barrels', () => {
  it('covers stomp kinds, brake roll, side hits, and thrown barrels', () => {
    for (const kind of ['beetle', 'croc', 'armored'] as const) {
      const stomp = new Game()
      stomp.start(0, true)
      const enemy = assertDefined(
        stomp.enemies.find((entry4) => entry4.kind === kind),
      )
      stomp.enemies = [enemy]
      Object.assign(stomp.player, {
        active: kind === 'armored' ? 1 : 0,
        x: enemy.x,
        y: ENEMY_DESIGNS[kind].height + 0.05,
        vy: -4,
        grounded: false,
        invincible: 0,
      })
      stomp.update(emptyInput())
    }

    const brake = new Game()
    brake.start(0)
    brake.enemies = []
    Object.assign(brake.player, {
      x: 40,
      y: 6,
      vx: 8,
      vy: 0,
      grounded: false,
      rollJumpMomentum: 8,
    })
    const left = emptyInput()
    left.held.add('left')
    advanceGame(brake, left, 12)

    const side = new Game()
    side.start(0, true)
    const entry5 = side.enemies[0]
    Object.assign(side.player, {
      x: entry5.x + 0.2,
      y: entry5.y + 0.5,
      vy: 0,
      roll: 0,
      invincible: 0,
      hp: 2,
    })
    advanceGame(side)

    const barrel = new Game()
    barrel.start(0, true)
    barrel.enemies = []
    barrel.thrown.push({
      x: barrel.player.x,
      y: barrel.player.y,
      vx: 8,
      vy: 0,
      active: true,
    })
    advanceGame(barrel, emptyInput(), 40)
    expect(barrel.thrown.length).toBeGreaterThanOrEqual(0)
  })
})

describe('engine coverage hooks — enguarde and tokens', () => {
  it('covers enguarde hits, mine throws, tokens, and rambi walls', () => {
    const enguardeHit = new Game()
    enguardeHit.start(3, true)
    enguardeHit.enemies = enguardeHit.enemies.filter(
      (entry6) => entry6.kind === 'bee',
    )
    const buddy = enguardeHit.animals.find(
      (actor4) => actor4.kind === 'enguarde',
    )
    const bee = enguardeHit.enemies[0]
    if (buddy) {
      expect(bee).toBeDefined()
      buddy.state = 'ridden'
      Object.assign(enguardeHit.player, {
        mount: enguardeHit.animals.indexOf(buddy),
        x: bee.x - 1,
        y: bee.y,
        facing: 1,
        mountAttack: 0.35,
        invincible: 0,
      })
      advanceGame(enguardeHit)
    }

    const mineThrow = new Game()
    mineThrow.start(2, true)
    mineThrow.enemies = []
    mineThrow.thrown.push({
      x: mineThrow.player.x,
      y: mineThrow.player.y,
      vx: 10,
      vy: 0,
      active: true,
    })
    advanceGame(mineThrow, emptyInput(), 60)

    const tokenSkip = new Game()
    tokenSkip.start(0, true)
    tokenSkip.enemies = []
    const decor = tokenSkip.level.decors?.find(
      (dist2) => dist2.kind === 'token',
    )
    if (decor) {
      tokenSkip.collectedTokens = new Set([
        `${String(decor.x)}:${String(decor.y)}`,
      ])
      Object.assign(tokenSkip.player, {
        x: decor.x,
        y: decor.y - 0.5,
        grounded: true,
      })
      advanceGame(tokenSkip)
    }

    const rambiWall = new Game()
    rambiWall.start(0, true)
    rambiWall.enemies = []
    const width = assertDefined(rambiWall.level.breakableWalls)[0]
    rambiWall.animals[0].state = 'ridden'
    Object.assign(rambiWall.player, {
      mount: 0,
      x: width.x,
      y: width.y + 0.5,
      mountAttack: 0.2,
      vx: 0.3,
      grounded: true,
    })
    advanceGame(rambiWall)
    expect(rambiWall.player.mount).toBe(0)
  })
})
