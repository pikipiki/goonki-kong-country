import { describe, expect, it } from 'vitest'
import canyon from './fixtures/playthrough/canyon.json'
import coral from './fixtures/playthrough/coral.json'
import boss from './fixtures/playthrough/boss.json'
import { emptyInput, Game, type Key } from '../src/game/engine'
import { inputTransition } from '../scripts/lib/playthrough/driver.mjs'

describe('complete playthrough inputs with normal damage', () => {
  it.each([
    ['canyon', canyon],
    ['coral', coral],
    ['boss', boss],
  ] as const)(
    'finishes %s without a death using only recorded controls',
    (_, fixture) => {
      const game = new Game()
      game.start(fixture.stageId, fixture.originalRoute)
      let held: Key[] = []
      let previousLives = game.lives
      for (const group of fixture.steps) {
        const next = group.keys as Key[]
        const input = inputTransition(emptyInput, held, next)
        for (let frame = 0; frame < group.frames; frame++) {
          game.update(input)
          expect(game.lives).toBeGreaterThanOrEqual(previousLives)
          previousLives = game.lives
        }
        held = next
      }
      expect(game.phase).toBe(fixture.expectedPhase)
      expect(game.player.hp).toBeGreaterThan(0)
      if (game.bossBattle) expect(game.bossBattle.hits).toBe(10)
    },
  )
})
