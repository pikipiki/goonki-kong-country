import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
describe('thrown barrel and nut collisions', () => {
  it('deactivates nuts that strike carried barrels mid-air', () => {
    const game = new Game()
    game.start(0)
    game.enemies = []
    game.thrown.push({ x: 8, y: 2, vx: 0, vy: 0, active: true })
    game.enemyShots.push({ x: 8, y: 2, vx: 0, vy: 0, active: true })
    game.update(emptyInput())
    expect(game.thrown[0]?.active).toBe(false)
    expect(game.enemyShots).toHaveLength(0)
  })
})
