import { describe, it, expect } from 'vitest'
import { Game, emptyInput, type Key } from '../src/game/engine'
import { ENGUARDE_SWIM_BODY } from '../src/game/animals'
import { coralBodyBlocked } from '../src/game/terrainSolids'
function frame(
  game: Game,
  keys: Key[] = [],
  pressed: Key[] = [],
  released: Key[] = [],
) {
  const index = emptyInput()
  keys.forEach((key) => index.held.add(key))
  pressed.forEach((key2) => index.pressed.add(key2))
  released.forEach((key3) => index.released.add(key3))
  game.update(index)
}
function mount(kind: 'rambi' | 'enguarde') {
  const game2 = new Game()
  game2.start(kind === 'rambi' ? 0 : 3)
  game2.enemies = []
  const actor = game2.animals[0]
  actor.state = 'ridden'
  game2.player.mount = 0
  Object.assign(game2.player, {
    x: kind === 'rambi' ? 12 : 20,
    y: kind === 'rambi' ? 0 : 1.8,
    vx: 0,
    vy: 0,
    grounded: kind === 'rambi',
  })
  return game2
}
describe('requested animal attacks and boss balance', () => {
  for (const kind of ['rambi', 'enguarde'] as const) {
    it(`${kind} accumulates while held, then accelerates on release`, () => {
      const game3 = mount(kind)
      frame(game3, ['action'], ['action'])
      for (let count = 0; count < 45; count++) {
        frame(game3, ['action'])
      }
      expect(game3.player.mountCharge).toBeGreaterThanOrEqual(0.65)
      expect(Math.abs(game3.player.vx)).toBeLessThan(0.01)
      const posX = game3.player.x
      frame(game3, [], [], ['action'])
      expect(game3.player.mountCharged).toBe(true)
      expect(game3.player.mountAttack).toBeGreaterThan(0.8)
      expect(game3.player.vx).toBe(kind === 'rambi' ? 16 : 18)
      expect(game3.player.x).toBeGreaterThan(posX)
    })
  }
  it('still attacks immediately on a short press', () => {
    const game4 = mount('rambi')
    frame(game4, [], ['action'])
    expect(game4.player.mountAttack).toBeGreaterThan(0)
    expect(game4.player.vx).toBe(9)
  })
  it('Enguarde immediately repeats short thrusts without building a charge', () => {
    const game5 = mount('enguarde')
    let attacks = 0
    game5.onEvent = (entry) => {
      if (entry === 'roll') {
        attacks++
      }
    }
    for (let count2 = 0; count2 < 8; count2++) {
      frame(game5, ['jump'], ['jump'])
      expect(game5.player.mountAttack).toBe(0.32)
      expect(game5.player.mountCharge).toBe(0)
      expect(game5.player.mountCharged).toBe(false)
      expect(game5.player.vx).toBeGreaterThan(0)
      expect(game5.player.vx).toBeLessThan(18)
      for (let index2 = 0; index2 < 5; index2++) {
        frame(game5)
      }
    }
    expect(attacks).toBe(8)
  })
})

describe('requested animal charge cancel', () => {
  it('a quick Enguarde thrust cancels a ready long charge instead of firing it', () => {
    const game6 = mount('enguarde')
    frame(game6, ['action'], ['action'])
    for (let index3 = 0; index3 < 45; index3++) {
      frame(game6, ['action'])
    }
    expect(game6.player.mountCharge).toBeGreaterThanOrEqual(0.65)
    frame(game6, ['jump'], ['jump'], ['action'])
    expect(game6.player.mountCharge).toBe(0)
    expect(game6.player.mountCharged).toBe(false)
    expect(game6.player.mountAttack).toBe(0.32)
    expect(game6.player.vx).toBeGreaterThan(0)
    expect(game6.player.vx).toBeLessThan(18)
  })
  it('Enguarde can rise on the imported reef while carrying the plush', () => {
    const game7 = new Game()
    game7.start(3, true)
    game7.enemies = []
    const actor2 = game7.animals[0]
    actor2.state = 'idle'
    Object.assign(game7.player, { x: actor2.x, y: actor2.y, vx: 0, vy: 0 })
    frame(game7)
    expect(game7.mount?.kind).toBe('enguarde')
    const posY = game7.player.y
    for (let count3 = 0; count3 < 25; count3++) {
      frame(game7, ['up'])
    }
    expect(game7.player.y).toBeGreaterThan(posY + 0.65)
    expect(
      coralBodyBlocked(game7.player.x, game7.player.y, ENGUARDE_SWIM_BODY),
    ).toBe(false)
  })
  it('Expresso floats and advances while jump is held, then descends when released', () => {
    const game8 = new Game()
    game8.start(4)
    game8.enemies = []
    game8.animals[0].state = 'ridden'
    game8.player.mount = 0
    Object.assign(game8.player, { x: 20, y: 5, vy: -8, grounded: false })
    const posX2 = game8.player.x
    for (let count4 = 0; count4 < 60; count4++) {
      frame(game8, ['jump', 'right'])
    }
    expect(game8.player.x).toBeGreaterThan(posX2 + 3)
    expect(game8.player.y).toBeGreaterThan(4.3)
    for (let count5 = 0; count5 < 20; count5++) {
      frame(game8)
    }
    expect(game8.player.vy).toBeLessThan(-2)
  })
})

describe('boss barrel and jump balance', () => {
  for (const timer of [0.1, 2.8]) {
    it(`a thrown barrel damages the boss at cycle ${String(timer)}`, () => {
      const game9 = new Game()
      game9.start(6)
      const barrel = game9.enemies[0]
      barrel.timer = timer
      game9.player.x = barrel.x - 5
      game9.thrown.push({ x: barrel.x - 0.2, y: 1, vx: 1, vy: 0, active: true })
      frame(game9)
      expect(barrel.hp).toBe(9)
      expect(game9.thrown.some((tick) => tick.active)).toBe(false)
      expect(game9.player.hp).toBe(2)
    })
  }
  it('picks up the actual arena barrel and throws it all the way into the boss', () => {
    const game10 = new Game()
    game10.start(6)
    const boss = game10.enemies[0]
    game10.player.x = 10
    frame(game10, ['action'], ['action'])
    expect(game10.player.carry).toBe(1)
    frame(game10, [], [], ['action'])
    expect(game10.player.carry).toBe(-1)
    expect(game10.thrown).toHaveLength(1)
    for (let count6 = 0; count6 < 300 && boss.hp === 10; count6++) {
      frame(game10)
    }
    expect(boss.hp).toBe(9)
    expect(game10.player.hp).toBe(2)
  })
  for (const timer of [0, 0.6, 1.2, 2.6]) {
    it(`can jump past the boss safely from its approach at cycle ${String(timer)}`, () => {
      const game11 = new Game()
      game11.start(6)
      const barrel2 = game11.enemies[0]
      barrel2.timer = timer
      game11.player.x = barrel2.x - 4
      let hurt = {}
      game11.onEvent = (entry2) => {
        if (entry2 === 'hurt') {
          hurt = { player: { ...game11.player }, boss: { ...barrel2 } }
        }
      }
      frame(game11, ['jump', 'right', 'run'], ['jump'])
      for (let count7 = 0; count7 < 75; count7++) {
        frame(
          game11,
          game11.player.x < barrel2.x + 0.3
            ? ['jump', 'right', 'run']
            : ['jump'],
        )
      }
      expect(game11.player.hp, JSON.stringify(hurt)).toBe(2)
    })
  }
})

describe('plush roll speeds and Rambi charges', () => {
  it('gives Rose the faster roll and Violette the former Rose speed', () => {
    const speeds = []
    for (const active of [0, 1]) {
      const game12 = new Game()
      game12.start(0)
      game12.animals = []
      game12.enemies = []
      Object.assign(game12.player, {
        active,
        x: 40,
        grounded: true,
        recentRun: 0,
      })
      frame(game12, ['right', 'run'], ['action'])
      speeds.push(game12.player.rollSpeed)
    }
    expect(speeds[0]).toBe(speeds[1] * 1.125)
  })

  it('never locks Rambi against an invisible wall after consecutive charges in ROM Jungle', () => {
    const game13 = new Game()
    game13.start(0, true)
    game13.enemies = []
    game13.completedBonus = new Set([0, 1, 2, 3])
    const actor3 = game13.animals[0]
    actor3.state = 'ridden'
    Object.assign(game13.player, {
      mount: 0,
      x: actor3.x,
      y: actor3.y,
      vx: 0,
      vy: 0,
      grounded: true,
      facing: 1,
    })
    for (let charge = 0; charge < 11; charge++) {
      frame(game13, ['action'], ['action'])
      for (let tick = 0; tick < 9; tick++) {
        frame(game13, ['action'])
      }
      frame(game13, [], [], ['action'])
      for (let frame2 = 0; frame2 < 24; frame2++) {
        frame(game13)
      }
      const x0Ref = game13.player.x
      frame(game13, ['right'])
      frame(game13, ['right'])
      frame(game13, ['right'])
      const movedRight = game13.player.x > x0Ref + 0.02
      frame(game13, ['left'])
      frame(game13, ['left'])
      frame(game13, ['left'])
      frame(game13, ['left'])
      frame(game13, ['left'])
      frame(game13, ['left'])
      const movedLeft = game13.player.x < x0Ref
      expect(
        movedRight || movedLeft,
        `stuck at charge ${String(charge)} x=${String(x0Ref)} y=${String(game13.player.y)}`,
      ).toBe(true)
      game13.player.facing = 1
    }
    expect(game13.player.x).toBeGreaterThan(134)
    // Also verify Rambi can steer left and right even while action remains held/latched
    const xHeld = game13.player.x
    for (let frame3 = 0; frame3 < 20; frame3++) {
      frame(game13, ['action', 'right'])
    }
    expect(game13.player.x).toBeGreaterThan(xHeld + 0.5)
    const xRight = game13.player.x
    for (let frame4 = 0; frame4 < 25; frame4++) {
      frame(game13, ['action', 'left'])
    }
    expect(game13.player.x).toBeLessThan(xRight - 0.5)
  })
})
