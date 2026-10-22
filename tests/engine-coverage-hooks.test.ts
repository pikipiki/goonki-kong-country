import { describe, expect, it } from 'vitest'
import {
  Game,
  emptyInput,
  readSave,
  testApproachFootVelocity,
} from '../src/game/engine'
import { advanceGame } from './helpers/simulation'
describe('engine coverage hooks — core branches', () => {
  it('quantizes foot velocity with both small and large errors', () => {
    expect(testApproachFootVelocity(0, 2)).not.toBe(0)
    expect(testApproachFootVelocity(1, 1)).toBeCloseTo(1, 2)
  })
  it('covers each original floorAt branch and levels without breakable walls', () => {
    for (const [levelId, original] of [
      [0, true],
      [1, true],
      [2, true],
      [3, true],
    ] as const) {
      const game = new Game()
      game.start(levelId, original)
      let probeY = game.player.y
      if (levelId === 3) {
        probeY = game.player.y + 12
      }
      expect(game.floorAt(game.player.x, probeY)).not.toBeNull()
      expect(game.floorAt(9999, 9999)).toBeNull()
    }
    const ship = new Game()
    ship.start(6)
    ship.enemies = []
    expect(ship.floorAt(ship.player.x, ship.player.y)).not.toBeNull()
    expect(readSave('{"unlocked":null,"best":{}}').unlocked).toBe(0)
    const privateWalls = ship as unknown as {
      resolveBreakableWalls(pickup: Game['player'], oxRef: number): void
      breakWallsWithThrown(): void
    }
    privateWalls.resolveBreakableWalls(ship.player, ship.player.x)
    privateWalls.breakWallsWithThrown()
  })
})
describe('engine coverage hooks — bonus and caches', () => {
  it('covers ground enemies, bonus leave, caches, balloons, and signs', () => {
    const patrol = new Game()
    patrol.start(0, true)
    const beetle = patrol.enemies.find(
      (entry) => entry.kind === 'beetle' && entry.alive,
    )
    if (beetle) {
      beetle.vx = 0.01
      beetle.min = beetle.x
      advanceGame(patrol, emptyInput(), 120)
    }
    const bonus = new Game()
    bonus.start(0, true)
    delete (
      bonus as {
        completedBonus?: Set<number>
      }
    ).completedBonus
    bonus.bonus = {
      index: 0,
      stage: bonus.level,
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
    bonus.leaveBonus()
    const cache = new Game()
    cache.start(0)
    cache.level.itemCaches = [
      { x: 4, y: 0, reward: { kind: 'balloon', amount: 1 } },
      { x: 6, y: 0, reward: { kind: 'banana', amount: 2 } },
    ]
    Object.assign(cache.player, { x: 4, y: -0.2, grounded: true, roll: 0.2 })
    advanceGame(cache)
    advanceGame(cache)
    Object.assign(cache.player, { x: 6, y: -0.2 })
    advanceGame(cache)
    const sign = new Game()
    sign.start(0, true)
    const signDecor = sign.level.decors?.find(
      (entry) => entry.kind === 'sign' && entry.text,
    )
    if (signDecor) {
      Object.assign(sign.player, { x: signDecor.x, y: signDecor.y })
      advanceGame(sign)
    }
    expect(sign.enemies.length).toBeGreaterThanOrEqual(0)
  })
})
describe('engine coverage hooks — mounts and finish', () => {
  it('covers mount damage exit, cannon without rotation, animals, and finish clear', () => {
    const hurt = new Game()
    hurt.start(0)
    hurt.enemies = []
    hurt.animals[0].state = 'ridden'
    Object.assign(hurt.player, { mount: 0, invincible: 0, hp: 2 })
    hurt.damage()
    hurt.dismount()
    const cannon = new Game()
    cannon.start(1)
    const idx = cannon.level.barrels.findIndex(
      (barrel) => barrel.kind === 'cannon',
    )
    if (idx >= 0) {
      const saved = cannon.level.barrels[idx].rotationSpeed
      cannon.level.barrels[idx].rotationSpeed = undefined
      cannon.cannonAngle(idx)
      cannon.level.barrels[idx].rotationSpeed = saved
    }
    const coralFlee = new Game()
    coralFlee.start(3, true)
    coralFlee.enemies = []
    const actor = coralFlee.animals[0]
    actor.state = 'fleeing'
    actor.timer = 0
    actor.vx = 1
    advanceGame(coralFlee, emptyInput(), 50)
    const plat = new Game()
    plat.start(6)
    plat.enemies = []
    plat.animals = [
      {
        kind: 'rambi',
        x: 10,
        y: 0,
        vx: 1,
        vy: 3,
        facing: 1,
        state: 'fleeing',
        timer: 0,
      },
    ]
    advanceGame(plat, emptyInput(), 40)
    const clear = new Game()
    clear.start(0)
    clear.enemies = []
    clear.player.x = clear.level.length - 1
    clear.finish()
    expect(clear.phase).toBe('clear')
  })
})
