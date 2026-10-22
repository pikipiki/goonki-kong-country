import { describe, it, expect } from 'vitest'
import { Game, emptyInput, ROM } from '../src/game/engine'
function advance(
  game: Game,
  held: Parameters<Set<string>['add']>[0][],
  frames: number,
) {
  const input = emptyInput()
  held.forEach((key) => input.held.add(key as never))
  for (let frame = 0; frame < frames; frame++) {
    game.update(input)
  }
}
describe('ROM-backed physics and platform collisions', () => {
  it('uses the constants verified from Rev 2 bytes', () => {
    expect(ROM.gravity).toBe(112)
    expect(ROM.held).toEqual([72, 90])
    expect(ROM.bounce).toEqual([1824, 2176])
    expect(ROM.jump).toEqual([1792, 2138])
    expect(ROM.bananas).toBe(100)
  })
  it('lands without sinking through the terrain at 60Hz', () => {
    const game = new Game()
    game.start()
    advance(game, [], 120)
    expect(game.player.y).toBe(0)
    expect(game.player.grounded).toBe(true)
  })
  it('moves in both directions and accelerates rather than teleporting', () => {
    const game = new Game()
    game.start()
    advance(game, ['right'], 45)
    expect(game.player.x).toBeGreaterThan(5)
    advance(game, ['left'], 100)
    expect(game.player.x).toBeLessThan(3)
  })
  it('keeps the held jump higher than a tapped jump', () => {
    function apex(held: boolean) {
      const game = new Game()
      game.start()
      const input = emptyInput()
      input.pressed.add('jump')
      input.held.add('jump')
      let max = 0
      for (let frame = 0; frame < 70; frame++) {
        if (frame === 3 && !held) {
          input.held.delete('jump')
        }
        game.update(input)
        max = Math.max(max, game.player.y)
      }
      return max
    }
    expect(apex(true)).toBeGreaterThan(apex(false) + 0.5)
  })
  it('does not jump again in mid-air', () => {
    const game = new Game()
    game.start()
    const input = emptyInput()
    input.pressed.add('jump')
    game.update(input)
    advance(game, [], 8)
    const velY = game.player.vy
    input.pressed.add('jump')
    game.update(input)
    expect(game.player.vy).toBeLessThan(velY)
  })
  it('gives Violette the faster horizontal speed', () => {
    const game = new Game()
    game.start()
    advance(game, ['right', 'run'], 30)
    const pink = game.player.vx
    game.player.active = 1
    advance(game, ['right', 'run'], 30)
    expect(game.player.vx).toBeGreaterThan(pink)
  })
  it('supports swimming across gaps and clamps the surface', () => {
    const game = new Game()
    game.start(3)
    advance(game, ['jump'], 300)
    expect(game.player.y).toBeLessThanOrEqual(6)
    expect(game.player.y).toBeGreaterThan(4)
    expect(game.lives).toBe(5)
  })
  it('automatically advances the minecart', () => {
    const game = new Game()
    game.start(2)
    const startX = game.player.x
    advance(game, [], 45)
    expect(game.player.x).toBeGreaterThan(startX + 5)
    expect(game.player.vx).toBe(8.5)
  })
})
