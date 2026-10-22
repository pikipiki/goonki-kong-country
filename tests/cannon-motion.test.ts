import { expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { ROM_REVERB } from '../src/game/originalReverb'
import { cannonWorldPosition } from '../src/game/cannonMotion'

it('imports the occupied-only horizontal motion from the canyon triple', () => {
  for (const index of [10, 11, 12]) {
    const barrel = ROM_REVERB.barrels[index]
    expect(barrel.motion?.speed).toBe(2.8125)
    expect(barrel.motion?.activation).toBe('occupied')
    expect(barrel.motion?.minimum).toBe(0)
    let max
    if (index === 10) {
      max = 2.625
    } else {
      max = 2.875
    }
    expect(barrel.motion?.maximum).toBe(max)
    for (let tick = 0; tick < 20; tick += 0.07) {
      const pickup = cannonWorldPosition(barrel, tick)
      expect(pickup.x).toBeGreaterThanOrEqual(barrel.x - 1e-8)
      expect(pickup.x).toBeLessThanOrEqual(barrel.x + max + 1e-8)
      expect(pickup.y).toBe(barrel.y)
    }
  }
})
it('holds the player inside the moving cannon at its displayed world position', () => {
  const game = new Game()
  game.start(1, true)
  game.enemies = []
  game.animals = []
  const barrel2 = game.level.barrels[11]
  Object.assign(game.player, {
    x: barrel2.x,
    y: barrel2.y,
    cannon: 11,
    grounded: false,
  })
  for (let frame = 0; frame < 60; frame++) {
    game.update(emptyInput())
  }
  expect(game.player.cannon).toBe(11)
  expect(game.player.x).toBeCloseTo(barrel2.x + 2.8125, 5)
  expect(game.player.x).toBe(game.cannonPosition(11).x)
  expect(game.player.y).toBe(game.cannonPosition(11).y)
})
it('escapes the real canyon cannon 11 by waiting for its source movement before shooting', () => {
  const game2 = new Game()
  game2.start(1, true)
  game2.enemies = []
  game2.animals = []
  const barrel3 = game2.level.barrels[11]
  Object.assign(game2.player, {
    x: barrel3.x,
    y: barrel3.y,
    cannon: 11,
    grounded: false,
  })
  for (let frame2 = 0; frame2 < 60; frame2++) {
    game2.update(emptyInput())
  }
  const input = emptyInput()
  input.pressed.add('action')
  game2.update(input)
  for (let frame3 = 0; frame3 < 24 && game2.player.cannon < 0; frame3++) {
    game2.update(emptyInput())
  }
  expect(game2.player.cannon).toBe(12)
  expect(game2.lives).toBe(5)
})
it('moves only occupied-triggered barrels on entry, while always-moving barrels use world time', () => {
  const game3 = new Game()
  game3.start(1, true)
  game3.enemies = []
  game3.animals = []
  const still = game3.cannonPosition(11)
  game3.time = 1
  expect(game3.cannonPosition(11)).toEqual(still)
  const moving = game3.level.barrels.findIndex(
    (barrel4) => barrel4.motion?.activation === 'always',
  )
  expect(moving).toBeGreaterThan(-1)
  expect(game3.cannonPosition(moving)).not.toEqual({
    x: game3.level.barrels[moving].x,
    y: game3.level.barrels[moving].y,
  })
})

it('captures the player body when the head enters a cannon above the feet', () => {
  const game4 = new Game()
  game4.start(1, true)
  game4.enemies = []
  game4.animals = []
  const barrel5 = game4.level.barrels[7]
  Object.assign(game4.player, {
    x: barrel5.x,
    y: barrel5.y - 1.8,
    vx: 0,
    vy: 0,
    grounded: false,
  })
  game4.update(emptyInput())
  expect(game4.player.cannon).toBe(7)
})
