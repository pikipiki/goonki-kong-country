import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { emptyInput, Game, type Key } from '../src/game/engine'
import { advanceGame } from './helpers/simulation'

interface PilotRule {
  when: { cannon?: number }
  keys: Key[]
}

describe('functional canyon controller', () => {
  it('fires the downward manual barrel and lands on the lower route', () => {
    const rules = JSON.parse(
      readFileSync(
        new URL('../reference/canyon-playthrough-rules.json', import.meta.url),
        'utf8',
      ),
    ) as PilotRule[]
    const rule = rules.find((candidate) => candidate.when.cannon === 26)
    if (!rule) throw new Error('Missing manual barrel 26 pilot rule')
    const game = new Game()
    game.start(1, true)
    const barrel = game.cannonPosition(26)
    Object.assign(game.player, { ...barrel, cannon: 26, grounded: false })
    const input = emptyInput()
    for (const action of rule.keys) {
      input.held.add(action)
      input.pressed.add(action)
    }
    advanceGame(game, input, 60)
    expect(game.player.cannon).toBe(-1)
    expect(game.player.grounded).toBe(true)
    expect(game.player.x).toBeCloseTo(barrel.x)
    expect(game.player.y).toBe(-1)
    expect(game.lives).toBe(5)
    expect(game.phase).toBe('playing')
  })
})
