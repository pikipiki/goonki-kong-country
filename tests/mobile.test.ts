import { expect, it } from 'vitest'
import { cameraLayout } from '../src/game/camera'
import { Controls } from '../src/game/input'
import { Game } from '../src/game/engine'
import { createBananaGeometry } from '../src/game3d/bananaGeometry'
import { ENEMY_DESIGNS } from '../src/game/enemies'
import { assertDefined } from './helpers/assertDefined'
it('keeps the player, highest jump, and a five-unit landing gap inside every phone viewport', () => {
  for (const [width, height] of [
    [320, 340],
    [360, 512],
    [390, 616],
    [430, 704],
    [740, 360],
    [844, 390],
    [932, 430],
  ]) {
    const layout = cameraLayout(width, height),
      player = 0.5 - layout.ahead / layout.worldWidth,
      landing = player + 5 / layout.worldWidth
    expect(player).toBeGreaterThan(0.23)
    expect(landing).toBeLessThan(0.95)
    expect(layout.lookY + layout.worldHeight / 2).toBeGreaterThan(4)
    expect(layout.lookY - layout.worldHeight / 2).toBeLessThan(-0.4)
  }
})
it('supports movement and jumping from independent touch contacts, with no stuck movement after cancellation', () => {
  const controls = new Controls(),
    game = new Game()
  game.start()
  controls.set('virtual-right', 'right', true)
  controls.set('virtual-run', 'run', true)
  for (let count = 0; count < 18; count++) {
    game.update(controls.input)
  }
  controls.set('screen-jump', 'jump', true)
  for (let count2 = 0; count2 < 12; count2++) {
    game.update(controls.input)
  }
  expect(game.player.x).toBeGreaterThan(4.5)
  expect(game.player.y).toBeGreaterThan(1)
  controls.set('screen-jump', 'jump', false)
  expect(controls.input.held.has('right')).toBe(true)
  controls.reset()
  for (let count3 = 0; count3 < 35; count3++) {
    game.update(controls.input)
  }
  expect(Math.abs(game.player.vx)).toBeLessThan(0.1)
  for (let count4 = 0; count4 < 60; count4++) {
    game.update(controls.input)
  }
  expect(game.player.vx).toBe(0)
})
it('models a curved volumetric banana with tapered ends and finite normals', () => {
  const geometry = createBananaGeometry(),
    bounds = assertDefined(geometry.boundingBox),
    positions = geometry.attributes.position,
    normals = geometry.attributes.normal
  expect(bounds.max.x - bounds.min.x).toBeGreaterThan(1)
  expect(bounds.max.z - bounds.min.z).toBeGreaterThan(0.16)
  expect(bounds.max.y - bounds.min.y).toBeGreaterThan(0.35)
  for (let index = 0; index < positions.count; index++) {
    const sum = normals.getX(index) + normals.getY(index) + normals.getZ(index)
    expect(Number.isFinite(sum)).toBe(true)
  }
  geometry.dispose()
})
it('bounces from the top of each new grounded enemy body with Rose', () => {
  for (const kind of ['beetle', 'croc', 'armored'] as const) {
    const game = new Game()
    game.start()
    const enemy = assertDefined(
      game.enemies.find((entry) => entry.kind === kind),
    )
    game.enemies = [enemy]
    Object.assign(game.player, {
      x: enemy.x,
      y: ENEMY_DESIGNS[kind].height + 0.05,
      vy: -4,
      grounded: false,
    })
    game.update(new Controls().input)
    expect(enemy.alive).toBe(false)
    expect(game.player.vy).toBeGreaterThan(10)
  }
})
it('keeps the helmeted enemy resistant to Violette at its new body height', () => {
  const game = new Game()
  game.start()
  const enemy = assertDefined(
    game.enemies.find((entry2) => entry2.kind === 'armored'),
  )
  game.enemies = [enemy]
  Object.assign(game.player, {
    active: 1,
    x: enemy.x,
    y: ENEMY_DESIGNS.armored.height + 0.05,
    vy: -4,
    grounded: false,
  })
  game.update(new Controls().input)
  expect(enemy.alive).toBe(true)
  expect(game.player.hp).toBe(1)
})
