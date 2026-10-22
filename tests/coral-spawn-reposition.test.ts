import { afterEach, describe, expect, it } from 'vitest'
import { Game } from '../src/game/engine'
import { ROM_CORAL } from '../src/game/originalCoral'
describe('coral spawn clearance', () => {
  const savedEnemies = ROM_CORAL.enemies
  const savedAnimals = ROM_CORAL.animals
  afterEach(() => {
    ROM_CORAL.enemies = savedEnemies
    ROM_CORAL.animals = savedAnimals
  })
  it('nudges enemies that sit on the start column after open-Y snapping', () => {
    const start = ROM_CORAL.start
    ROM_CORAL.enemies = [
      {
        x: start.x + 1,
        y: start.y,
        min: 0,
        max: start.x + 40,
        kind: 'croc',
        patrolSpeed: 1.75,
      },
    ]
    ROM_CORAL.animals = []
    const game = new Game()
    game.start(3, true)
    expect(game.enemies[0].x).toBeCloseTo(start.x + 4, 1)
  })
})
