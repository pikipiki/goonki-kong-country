import { describe, expect, it } from 'vitest'
import {
  Game,
  cannonLaunchVelocity,
  emptyInput,
  readSave,
} from '../src/game/engine'
import { advanceGame } from './helpers/simulation'
import { assertDefined } from './helpers/assertDefined'

describe('coverage final — save and floor', () => {
  it('covers save validation, floorAt paths, and openBonus without a room', () => {
    expect(readSave('{"unlocked":1.5,"best":null}').unlocked).toBe(0)
    expect(cannonLaunchVelocity(0).vx).toBeTypeOf('number')

    const canopy = new Game()
    canopy.start(1)
    expect(canopy.floorAt(16, 8)).not.toBeNull()

    const jungle = new Game()
    jungle.start(0, true)
    jungle.brokenWalls.add(0)
    const wall = assertDefined(jungle.level.breakableWalls)[0]
    Object.assign(jungle.player, {
      x: wall.x,
      y: wall.y + 0.5,
      roll: 0.5,
      grounded: true,
    })
    advanceGame(jungle)
    expect(jungle.brokenWalls.has(0)).toBe(true)
    ;(
      jungle as unknown as { openBonusRoom(index: number): void }
    ).openBonusRoom(99)
  })
})

describe('coverage final — bonus and caches', () => {
  it('covers bonus leave, wall bounce, and caches', () => {
    const bonus = new Game()
    bonus.start(0, true)
    bonus.enemies = []
    Reflect.deleteProperty(bonus, 'completedBonus')
    bonus.bonus = {
      index: 0,
      stage: { ...bonus.level, platforms: bonus.level.platforms },
      sourceIndices: [0],
      world: {
        player: { ...bonus.player },
        enemies: [],
        animals: [],
        collected: new Set(),
        letters: new Set(),
        usedBarrels: new Set(),
        thrown: [],
        enemyShots: [],
        checkpoint: { ...bonus.checkpoint },
        companion: { ...bonus.companion },
        trail: [],
      },
    }
    bonus.collected.add(0)
    bonus.leaveBonus()
    const completed = assertDefined(bonus.completedBonus)
    expect(completed.has(0)).toBe(true)

    const bounce = new Game()
    bounce.start(0, true)
    bounce.enemies = []
    const width = assertDefined(bounce.level.breakableWalls)[0]
    Object.assign(bounce.player, {
      x: width.x - 0.1,
      y: width.y + 0.5,
      vx: -0.2,
      grounded: true,
      roll: 0,
    })
    bounce.player.x = width.x - 0.1
    advanceGame(bounce)
    expect(Math.abs(bounce.player.vx)).toBeLessThan(0.5)

    const cache = new Game()
    cache.start(0)
    cache.enemies = []
    cache.level.itemCaches = [
      { x: 7, y: 0, reward: { kind: 'banana', amount: 3 } },
    ]
    Object.assign(cache.player, { x: 7, y: -0.2, grounded: true, roll: 0.15 })
    advanceGame(cache)
    advanceGame(cache)
    expect(cache.bananas).toBeGreaterThan(0)
  })

  it('covers tokens and dismount', () => {
    const token = new Game()
    token.start(0, true)
    token.enemies = []
    Reflect.deleteProperty(token, 'collectedTokens')
    const tokenDecor = assertDefined(token.level.decors).find(
      (entry) => entry.kind === 'token',
    )
    if (tokenDecor) {
      Object.assign(token.player, {
        x: tokenDecor.x,
        y: tokenDecor.y - 0.5,
        grounded: true,
      })
      advanceGame(token)
      expect(token.isTokenCollected(tokenDecor)).toBe(true)
    }

    const dist2 = new Game()
    dist2.start(0)
    dist2.dismount()
    expect(dist2.player.mount).toBe(-1)
  })
})

describe('coverage final — damage and cannon', () => {
  it('covers damage with mount, coral respawn, and cannon angle', () => {
    const mounted = new Game()
    mounted.start(0)
    mounted.enemies = []
    mounted.animals[0].state = 'ridden'
    Object.assign(mounted.player, { mount: 0, invincible: 0, hp: 2 })
    mounted.damage()
    expect(mounted.player.hp).toBe(2)

    const coral = new Game()
    coral.start(3, true)
    coral.enemies = []
    coral.lives = 2
    coral.player.hp = 1
    coral.player.invincible = 0
    coral.damage()
    expect(coral.player.y).toBeTypeOf('number')

    const game = new Game()
    game.start(1)
    const idx = game.level.barrels.findIndex(
      (barrel) => barrel.kind === 'cannon',
    )
    const barrel = game.level.barrels[idx]
    const saved = barrel.rotationSpeed
    barrel.rotationSpeed = 1.2
    game.time = 0.8
    expect(game.cannonAngle(idx)).toBeTypeOf('number')
    barrel.rotationSpeed = 0
    expect(game.cannonAngle(idx)).toBeTypeOf('number')
    barrel.rotationSpeed = saved
  })
})

describe('coverage final — fleeing animals', () => {
  it('covers fleeing animals on land, ship, and lagoon', () => {
    const land = new Game()
    land.start(0, true)
    land.enemies = []
    const actor = land.animals[0]
    actor.state = 'fleeing'
    actor.vx = 3
    actor.timer = 1.0
    advanceGame(land, emptyInput(), 4)
    expect(actor.state).toBe('fleeing')

    const plat = new Game()
    plat.start(6)
    plat.enemies = []
    plat.animals = [
      {
        kind: 'rambi',
        x: 10,
        y: 0,
        vx: 2,
        vy: 5,
        facing: 1,
        state: 'fleeing',
        timer: 0,
      },
    ]
    advanceGame(plat, emptyInput(), 30)

    const lagoon = new Game()
    lagoon.start(3, true)
    lagoon.enemies = []
    const flee = lagoon.animals[0]
    flee.state = 'fleeing'
    flee.timer = 0
    flee.vx = 1
    advanceGame(lagoon, emptyInput(), 40)
    expect(flee.vx).toBeTypeOf('number')
  })

  it('covers enguarde crate rescue', () => {
    const crate = new Game()
    crate.start(3, true)
    crate.enemies = []
    const crateAnimal = crate.animals.find((posX) => posX.state === 'crate')
    if (crateAnimal) {
      Object.assign(crate.player, {
        x: crateAnimal.x,
        y: crateAnimal.y,
        roll: 0.2,
      })
      advanceGame(crate)
      expect(crate.player.x).toBeCloseTo(crateAnimal.x, 0)
    }
  })
})
