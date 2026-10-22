import { expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { pick } from '../src/utils/pick'

for (const active of [0, 1]) {
  it(`crosses the real canyon high-branch gap with a roll jump as plush ${String(active)}`, () => {
    const game = new Game()
    game.start(1, true)
    game.enemies = []
    game.animals = []
    Object.assign(game.player, {
      active,
      x: 90.7,
      y: 7.5,
      vx: 5.625,
      vy: 0,
      grounded: true,
      recentRun: 0,
    })
    let landed = false
    for (let frame = 0; frame < 110; frame++) {
      const index = emptyInput()
      index.held = new Set([
        'right',
        'run',
        ...pick(frame >= 18, ['jump' as const], []),
      ])
      if (frame === 0) {
        index.pressed.add('action')
      }
      if (frame === 18) {
        index.pressed.add('jump')
      }
      game.update(index)
      if (game.player.x > 99 && game.player.y >= 5.4 && game.player.grounded) {
        landed = true
        break
      }
    }
    expect(landed).toBe(true)
    expect(game.lives).toBe(5)
    expect(game.player.rollJumpMomentum).toBe(0)
  })
}

it('allows braking and reversal during a roll jump instead of forcing a direction', () => {
  const game2 = new Game()
  game2.start()
  game2.enemies = []
  game2.animals = []
  Object.assign(game2.player, {
    x: 40,
    y: 6,
    vx: 8,
    vy: 0,
    grounded: false,
    rollJumpMomentum: 8,
  })
  for (let frame2 = 0; frame2 < 12; frame2++) {
    const index2 = emptyInput()
    index2.held.add('left')
    game2.update(index2)
  }
  expect(game2.player.vx).toBeLessThan(5)
  expect(game2.player.x).toBeLessThan(41.6)
})
