import { describe, expect, it } from 'vitest'
import { emptyInput, Game } from '../src/game/engine'
import { advanceGame } from './helpers/simulation'
import {
  assertPrediction,
  inputTransition,
  offlineGame,
  packGame,
} from '../scripts/lib/playthrough/driver.mjs'

describe('playthrough input contract', () => {
  it('keeps a held jump held without inventing a new press or release', () => {
    const input = inputTransition(
      emptyInput,
      ['right', 'jump'],
      ['right', 'jump'],
    )
    expect([...input.held]).toEqual(['right', 'jump'])
    expect(input.pressed.size).toBe(0)
    expect(input.released.size).toBe(0)
  })

  it('releases removed controls and presses only new controls', () => {
    const input = inputTransition(
      emptyInput,
      ['right', 'run'],
      ['left', 'jump'],
    )
    expect([...input.pressed]).toEqual(['left', 'jump'])
    expect([...input.released]).toEqual(['right', 'run'])
  })

  it('scores candidates on independent state without altering the browser snapshot', () => {
    const original = new Game()
    original.start(1, true)
    const clone = offlineGame(Game, packGame(original))
    const before = structuredClone(original.player)
    advanceGame(clone, inputTransition(emptyInput, [], ['right', 'jump']), 12)
    clone.collected.add(17)
    expect(original.player).toEqual(before)
    expect(original.collected.has(17)).toBe(false)
    expect(clone.time).toBeGreaterThan(original.time)
  })

  it('fails on a missed frame, missed key or divergent enemy instead of retrying', () => {
    const game = new Game()
    game.start(1, true)
    const copy = () => offlineGame(Game, packGame(game))
    expect(() => {
      assertPrediction(game, copy())
    }).not.toThrow()
    const missedFrame = copy()
    missedFrame.time += 1 / 60
    expect(() => {
      assertPrediction(game, missedFrame)
    }).toThrow('clock drift')
    const missedKey = copy()
    missedKey.player.vx += 1
    expect(() => {
      assertPrediction(game, missedKey)
    }).toThrow('player.vx')
    const wrongEnemy = copy()
    wrongEnemy.enemies[0].x += 0.1
    expect(() => {
      assertPrediction(game, wrongEnemy)
    }).toThrow('enemy 0.x')
  })
})
