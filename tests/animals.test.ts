import { assertDefined } from './helpers/assertDefined'
import { describe, expect, it } from 'vitest'
import { Game, emptyInput, type Key } from '../src/game/engine'
import { ANIMAL_DESIGNS, BUDDY_PHYSICS } from '../src/game/animals'
function stepGame(game: Game, frames: number, held: Key[] = []) {
  const input = emptyInput()
  held.forEach((key) => input.held.add(key))
  for (let frame = 0; frame < frames; frame++) {
    game.update(input)
  }
}
function mountedGame(level: number, index = 0) {
  const game = new Game()
  game.start(level)
  game.enemies = []
  const animal = game.animals[index]
  animal.state = 'idle'
  Object.assign(game.player, {
    x: animal.x,
    y: animal.y + ANIMAL_DESIGNS[animal.kind].seat + 0.03,
    vy: -5,
    grounded: false,
  })
  game.update(emptyInput())
  expect(game.player.mount).toBe(index)
  return game
}
function pressKey(game: Game, key: Key, held: Key[] = []) {
  const input = emptyInput()
  input.pressed.add(key)
  held.forEach((heldKey) => input.held.add(heldKey))
  game.update(input)
}
describe('animal crates, riding, recovery and original abilities', () => {
  it('opens a crate with action and mounts only by landing on its back', () => {
    const game = new Game()
    game.start()
    game.player.x = 11
    pressKey(game, 'action')
    expect(game.animals[0].state).toBe('idle')
    expect(game.player.mount).toBe(-1)
    Object.assign(game.player, { y: 1.28, vy: -5, grounded: false })
    game.update(emptyInput())
    expect(game.mount?.kind).toBe('rambi')
    expect(game.player.roll).toBe(0)
  })
  it('uses verified raw walk/run/jump values for the three land mounts', () => {
    expect(ANIMAL_DESIGNS.rambi.walk).toBe(3.75)
    expect(ANIMAL_DESIGNS.rambi.run).toBe(6.5625)
    expect(ANIMAL_DESIGNS.winky.run).toBe(5.625)
    expect(ANIMAL_DESIGNS.expresso.run).toBe(7.5)
    expect(ANIMAL_DESIGNS.winky.jump).toBe(15)
    expect(ANIMAL_DESIGNS.rambi.jump).toBe(13.125)
    expect(BUDDY_PHYSICS.stabSpeed).toBe(7.5)
  })
  it('dismounts with one remaining plush and does not immediately remount', () => {
    const game = mountedGame(0)
    game.player.hp = 1
    pressKey(game, 'swap')
    expect(game.player.mount).toBe(-1)
    expect(game.animals[0].state).toBe('idle')
    expect(game.player.vy).toBeGreaterThan(0)
    expect(game.player.active).toBe(0)
    stepGame(game, 5)
    expect(game.player.mount).toBe(-1)
  })
  it('a mounted hit releases the animal without consuming a plush or life', () => {
    const game = mountedGame(0)
    const healthBefore = game.player.hp
    game.damage()
    expect(game.player.mount).toBe(-1)
    expect(game.player.hp).toBe(healthBefore)
    expect(game.lives).toBe(5)
    expect(game.animals[0].state).toBe('fleeing')
    const startX = game.animals[0].x
    stepGame(game, 10)
    expect(game.animals[0].x).toBeGreaterThan(startX)
    expect(game.player.invincible).toBeGreaterThan(0)
  })
})
describe('mounted animal combat and movement', () => {
  it('Rambi horn defeats a grounded crocodile ahead', () => {
    const game = mountedGame(0)
    const original = new Game()
    original.start()
    const template = assertDefined(
      original.enemies.find((entry) => entry.kind === 'croc'),
    )
    expect(template).toBeDefined()
    const enemy = {
      ...template,
      x: game.player.x + 0.8,
      y: 0,
      min: 0,
      max: 100,
      vx: 0,
    }
    game.enemies = [enemy]
    game.update(emptyInput())
    expect(enemy.alive).toBe(false)
    expect(game.player.mount).toBe(0)
  })
  it('Winky jumps higher than the same plush on foot', () => {
    function apex(riding: boolean) {
      const game = mountedGame(1)
      if (!riding) {
        game.player.mount = -1
        game.animals = []
      }
      const input = emptyInput()
      input.pressed.add('jump')
      input.held.add('jump')
      let top = game.player.y
      for (let frame = 0; frame < 80; frame++) {
        game.update(input)
        top = Math.max(top, game.player.y)
      }
      return top
    }
    expect(apex(true)).toBeGreaterThan(apex(false) + 0.5)
  })
  it('Expresso slows descent while flutter is held', () => {
    const game = mountedGame(4)
    Object.assign(game.player, { y: 5, vy: -8, grounded: false })
    stepGame(game, 12, ['jump'])
    expect(game.player.vy).toBeGreaterThanOrEqual(-1.8)
    expect(game.player.y).toBeGreaterThan(4)
    stepGame(game, 12)
    expect(game.player.vy).toBeLessThan(-1.8)
  })
  it('Enguarde steers both vertically and horizontally, attacks, then dismounts', () => {
    const game = new Game()
    game.start(3)
    game.enemies = []
    game.animals[0].state = 'idle'
    Object.assign(game.player, { x: 10, y: 1.8, vy: 0 })
    game.update(emptyInput())
    expect(game.mount?.kind).toBe('enguarde')
    const startY = game.player.y
    stepGame(game, 15, ['up', 'right'])
    expect(game.player.y).toBeGreaterThan(startY)
    expect(game.player.x).toBeGreaterThan(10)
    pressKey(game, 'action')
    stepGame(game, 1)
    expect(game.player.vx).toBe(BUDDY_PHYSICS.stabSpeed)
    expect(game.player.mountAttack).toBeGreaterThan(0)
    pressKey(game, 'swap')
    expect(game.player.mount).toBe(-1)
  })
})
describe('roll/cartwheel momentum and edge jump', () => {
  it('can jump after leaving a ledge during the roll, once', () => {
    const game = new Game()
    game.start()
    game.enemies = []
    game.animals = []
    Object.assign(game.player, { x: 46.25, y: 0, grounded: true })
    pressKey(game, 'action', ['right', 'run'])
    stepGame(game, 11, ['right'])
    expect(game.player.grounded).toBe(false)
    expect(game.player.coyote).toBe(0)
    expect(game.player.rollJump).toBe(true)
    pressKey(game, 'jump', ['jump', 'right'])
    expect(game.player.vy).toBeGreaterThan(0)
    expect(game.player.rollJump).toBe(false)
    expect(game.player.roll).toBe(0)
    stepGame(game, 5)
    const fallSpeed = game.player.vy
    pressKey(game, 'jump')
    expect(game.player.vy).toBeLessThan(fallSpeed)
  })
  it('does not start an attack roll in midair', () => {
    const game = new Game()
    game.start()
    Object.assign(game.player, { x: 40, y: 4, grounded: false })
    pressKey(game, 'action')
    expect(game.player.roll).toBe(0)
  })
  it('a chained cartwheel accelerates, defeats Klump and stays below the ROM cap', () => {
    const game = new Game()
    game.start()
    game.animals = []
    Object.assign(game.player, { x: 40, active: 1, grounded: true })
    const armor = assertDefined(
      game.enemies.find((entry) => entry.kind === 'armored'),
    )
    expect(armor).toBeDefined()
    Object.assign(armor, { x: 40.7, y: 0, min: 0, max: 100, vx: 0 })
    game.enemies = [armor]
    pressKey(game, 'action', ['right', 'run'])
    expect(armor.alive).toBe(false)
    expect(game.player.rollChain).toBe(1)
    expect(game.player.rollSpeed).toBe(
      BUDDY_PHYSICS.rollRunning + BUDDY_PHYSICS.chainIncrement,
    )
    expect(game.player.rollSpeed).toBeLessThanOrEqual(BUDDY_PHYSICS.chainCap)
    expect(game.player.hp).toBe(2)
  })
})
