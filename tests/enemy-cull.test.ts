import { describe, expect, it } from 'vitest'
import {
  Game,
  enemySimulationActive,
  enemyVisibleToCamera,
} from '../src/game/engine'
describe('enemy camera culling', () => {
  it('keeps the entire visible water column active and culls only distant enemies', () => {
    const game = new Game()
    game.start(3, true)
    game.player.x = 20
    game.player.y = 3.2
    const near = game.enemies[0]
    near.x = 21
    near.y = 3.1
    near.alive = true
    const farDepth = game.enemies[1]
    farDepth.x = 21
    farDepth.y = 5.45
    farDepth.alive = true
    const farX = game.enemies[2]
    farX.x = 70
    farX.y = 3.1
    farX.alive = true
    expect(enemyVisibleToCamera(game, near)).toBe(true)
    expect(enemyVisibleToCamera(game, farDepth)).toBe(true)
    expect(enemyVisibleToCamera(game, farX)).toBe(false)
    expect(enemySimulationActive(game, near)).toBe(true)
    expect(enemySimulationActive(game, farX)).toBe(false)
  })
  it('never reveals hidden entry enemies after an arbitrary travel threshold', () => {
    const game = new Game()
    game.start(3, true)
    const enemy = game.enemies[0]
    enemy.x = game.player.x + 3
    enemy.y = game.player.y - 2
    expect(enemyVisibleToCamera(game, enemy)).toBe(true)
    expect(enemySimulationActive(game, enemy)).toBe(true)
    game.player.x += 3.5
    expect(enemyVisibleToCamera(game, enemy)).toBe(true)
  })
  it('uses the actual camera frame with padding in either orientation', () => {
    const game = new Game()
    game.start(3, true)
    game.cameraBounds = { x: 25, y: 4, halfX: 15, halfY: 5 }
    const enemy = game.enemies[0]
    enemy.x = 39
    enemy.y = 5
    expect(enemyVisibleToCamera(game, enemy)).toBe(true)
    expect(enemySimulationActive(game, enemy)).toBe(true)
    enemy.x = 50
    expect(enemyVisibleToCamera(game, enemy)).toBe(false)
  })
})

describe('simulation independent of rendering', () => {
  it('keeps the same activation region with a narrow, wide or stale camera', () => {
    const game = new Game()
    game.start(3, true)
    game.player.x = 20
    game.player.y = 3
    const enemy = game.enemies[0]
    enemy.x = 50
    enemy.y = 3
    enemy.alive = true
    const active: boolean[] = []
    for (const bounds of [
      null,
      { x: 20, y: 3, halfX: 4, halfY: 5 },
      { x: 20, y: 3, halfX: 28, halfY: 24 },
      { x: 200, y: 80, halfX: 4, halfY: 5 },
    ]) {
      game.cameraBounds = bounds
      active.push(enemySimulationActive(game, enemy))
    }
    expect(active).toEqual([true, true, true, true])
    enemy.x = 100
    expect(enemySimulationActive(game, enemy)).toBe(false)
  })

  it('produces the same enemy motion when the camera refreshes at different rates', () => {
    const sessions = [new Game(), new Game(), new Game()]
    for (const game of sessions) game.start(3, true)
    for (let frame = 0; frame < 300; frame++) {
      sessions.forEach((game, index) => {
        if (frame % (index * 3 + 1) === 0) {
          game.cameraBounds = {
            x: game.player.x + index * 12,
            y: game.player.y,
            halfX: 4 + index * 10,
            halfY: 5 + index * 8,
          }
        }
        game.update({
          held: new Set(['right']),
          pressed: new Set(),
          released: new Set(),
        })
      })
    }
    expect(sessions[1].enemies).toEqual(sessions[0].enemies)
    expect(sessions[2].enemies).toEqual(sessions[0].enemies)
    expect(
      sessions.map((game) => [
        game.player.x,
        game.player.y,
        game.player.hp,
        game.lives,
      ]),
    ).toEqual(
      Array.from({ length: 3 }, () => [
        sessions[0].player.x,
        sessions[0].player.y,
        sessions[0].player.hp,
        sessions[0].lives,
      ]),
    )
  })
})
