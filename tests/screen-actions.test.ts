import { expect, it } from 'vitest'
import { Game } from '../src/game/engine'
import { Controls } from '../src/game/input'
function tick(game: Game, controls: Controls, count = 1) {
  for (let index = 0; index < count; index++) {
    game.update(controls.input)
  }
}
it('carries a barrel after a screen tap, jumps with free hands, then throws on the next tap', () => {
  const game2 = new Game()
  game2.start(6)
  game2.enemies = []
  game2.animals = []
  game2.player.x = 10
  const controls2 = new Controls()
  controls2.set('screen-action', 'action', true)
  tick(game2, controls2)
  expect(game2.player.carry).toBe(1)
  controls2.set('screen-action', 'action', false)
  tick(game2, controls2)
  expect(game2.player.carry).toBe(1)
  expect(game2.thrown).toHaveLength(0)
  controls2.set('screen-jump', 'jump', true)
  tick(game2, controls2, 12)
  expect(game2.player.y).toBeGreaterThan(0.2)
  expect(game2.player.carry).toBe(1)
  controls2.set('screen-jump', 'jump', false)
  tick(game2, controls2)
  controls2.set('screen-action', 'action', true)
  tick(game2, controls2)
  expect(game2.player.carry).toBe(-1)
  expect(game2.thrown).toHaveLength(1)
})
it('keeps keyboard release-to-throw and avoids a false release from a second input source', () => {
  const controls3 = new Controls()
  controls3.set('keyboard-KeyX', 'action', true)
  controls3.input.pressed.clear()
  controls3.set('screen-action', 'action', true)
  controls3.set('screen-action', 'action', false)
  expect(controls3.input.held.has('action')).toBe(true)
  expect(controls3.input.released.has('action')).toBe(false)
  expect(controls3.input.tapAction).toBe(false)
  const game3 = new Game()
  game3.start(6)
  game3.enemies = []
  game3.animals = []
  game3.player.x = 10
  tick(game3, controls3)
  expect(game3.player.carry).toBe(1)
  controls3.set('keyboard-KeyX', 'action', false)
  tick(game3, controls3)
  expect(game3.player.carry).toBe(-1)
  expect(game3.thrown).toHaveLength(1)
})
it('allows the rider to jump while a screen charge remains latched', () => {
  const game4 = new Game()
  game4.start(0)
  game4.enemies = []
  game4.animals[0].state = 'ridden'
  Object.assign(game4.player, { mount: 0, x: 12, y: 0, grounded: true })
  const controls4 = new Controls()
  controls4.set('screen-action', 'action', true)
  tick(game4, controls4, 44)
  expect(game4.player.mountCharge).toBeGreaterThanOrEqual(0.65)
  controls4.set('screen-jump', 'jump', true)
  tick(game4, controls4, 12)
  expect(game4.player.y).toBeGreaterThan(0.2)
  expect(game4.player.mountCharge).toBeGreaterThanOrEqual(0.65)
  controls4.set('screen-action', 'action', false)
  tick(game4, controls4)
  expect(game4.player.mountCharged).toBe(true)
  expect(game4.player.vx).toBe(16)
})
