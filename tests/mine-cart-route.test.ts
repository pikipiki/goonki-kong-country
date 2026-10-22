import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import {
  ROM_MINE_CART,
  ORIGINAL_MINE_CART_PROVENANCE,
} from '../src/game/originalMineCart'
import startMeta from '../reference/mine-cart-start.json'
describe('ROM Mine Cart Carnage route', () => {
  it('loads mine cart terrain on map slot 2 with originalRoute', () => {
    const game = new Game()
    game.start(2, true)
    expect(game.level.originalTerrain).toBe('mineCart')
    expect(game.level.name).toBe(ROM_MINE_CART.name)
  })
  it('runs in cart mode from probed start', () => {
    const game = new Game()
    game.start(2, true)
    game.enemies = []
    expect(game.player.x).toBe(startMeta.startXWorld)
    expect(game.player.y).toBeCloseTo(startMeta.startYWorld, 3)
    const input = emptyInput()
    input.held.add('right')
    const x0Ref = game.player.x
    for (let index = 0; index < 30; index++) {
      game.update(input)
    }
    expect(game.player.x).toBeGreaterThan(x0Ref + 1)
    expect(Math.abs(game.player.vx)).toBeGreaterThan(5)
  })
  it('imports spawn band inside level length', () => {
    for (const row of ORIGINAL_MINE_CART_PROVENANCE.imported) {
      expect(row.originalX).toBeGreaterThanOrEqual(startMeta.romWorldX - 8)
      expect((row.originalX - startMeta.romWorldX) / 32).toBeLessThanOrEqual(
        ROM_MINE_CART.length + 2,
      )
    }
  })
})
