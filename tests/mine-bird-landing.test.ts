import { expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { ROM_MINE_CART } from '../src/game/originalMineCart'
import { mineEncounterClearance } from '../src/game/routeSafety'
import { assertDefined } from './helpers/assertDefined'
import { runMineBirdLandingTrial } from './helpers/mineBirdLandingSim'

for (const birdX of [106.28125, 404.34375]) {
  for (const active of [0, 1]) {
    it(`lands safely after bird ${String(birdX)} with plush ${String(active)}, including short mobile taps`, () => {
      for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        for (const held of [0, 21, 90]) {
          runMineBirdLandingTrial(birdX, active, phase, held)
        }
      }
    })
  }
}
it('preserves source enemy anchors and keeps all mine Zingers alive and dangerous', () => {
  const before = JSON.stringify(ROM_MINE_CART.enemies),
    adapted = mineEncounterClearance(ROM_MINE_CART.enemies)
  expect(JSON.stringify(ROM_MINE_CART.enemies)).toBe(before)
  expect(adapted.map((entry4) => entry4.x)).toEqual(
    ROM_MINE_CART.enemies.map((entry5) => entry5.x),
  )
  const game2 = new Game()
  game2.start(2, true)
  expect(game2.enemies.filter((entry6) => entry6.alive)).toHaveLength(30)
  for (const posX of [114.90625, 412.90625]) {
    const bee = assertDefined(
      game2.enemies.find(
        (entry7) =>
          entry7.kind === 'bee' &&
          entry7.pattern !== 'necky' &&
          entry7.x === posX,
      ),
    )
    Object.assign(game2.player, {
      x: bee.x,
      y: bee.y,
      vy: 0,
      grounded: false,
      invincible: 0,
    })
    game2.update(emptyInput())
    expect(game2.player.hp).toBe(1)
    expect(bee.alive).toBe(true)
    game2.player.hp = 2
  }
})

it('refreshes the old bee placement in an already-open mine run', () => {
  const game3 = new Game()
  game3.start(2, true)
  Reflect.deleteProperty(game3, 'mineRecoveryLayout')
  const bee = assertDefined(
    game3.enemies.find(
      (entry8) =>
        entry8.kind === 'bee' &&
        entry8.pattern !== 'necky' &&
        entry8.x === 114.90625,
    ),
  )
  bee.originY = 1.28125
  bee.y = 1.28125
  bee.hoverAmplitude = 0.6
  const posX2 = game3.player.x
  game3.update(emptyInput())
  expect(bee.originY).toBe(7.53125)
  expect(bee.hoverAmplitude).toBe(0)
  expect(game3.player.x).toBeGreaterThan(posX2)
  expect(game3.lives).toBe(5)
})
