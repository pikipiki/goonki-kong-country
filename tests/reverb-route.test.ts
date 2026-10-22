import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import {
  ROM_REVERB,
  ORIGINAL_REVERB_PROVENANCE,
} from '../src/game/originalReverb'
import startMeta from '../reference/reverb-start.json'
describe('ROM Reverb Cave route', () => {
  it('loads cave terrain on map slot 1 with originalRoute', () => {
    const game = new Game()
    game.start(1, true)
    expect(game.level.originalTerrain).toBe('cave')
    expect(game.level.name).toBe(ROM_REVERB.name)
  })
  it('keeps imported spawn X inside level length', () => {
    for (const row of ORIGINAL_REVERB_PROVENANCE.imported) {
      expect(row.originalX).toBeGreaterThanOrEqual(25400)
      expect(row.originalX / 32 - 25472 / 32).toBeLessThanOrEqual(
        ROM_REVERB.length + 2,
      )
    }
  })
  it('spawns at x=0 and walks on flat cave floor band', () => {
    const game = new Game()
    game.start(1, true)
    game.enemies = []
    game.level.barrels.forEach((_, index) => game.usedBarrels.add(index))
    expect(game.player.x).toBe(0)
    expect(game.player.y).toBeCloseTo(startMeta.startYWorld, 3)
    const flatX = startMeta.flatWalkWorldX
    const input = emptyInput()
    input.held.add('right')
    let traveled = 0
    for (let index2 = 0; index2 < 120; index2++) {
      game.player.x = flatX
      game.player.y = 0
      game.player.grounded = true
      game.player.vy = 0
      const before = game.player.x
      game.update(input)
      traveled += game.player.x - before
    }
    expect(traveled).toBeGreaterThan(2)
  })
})
