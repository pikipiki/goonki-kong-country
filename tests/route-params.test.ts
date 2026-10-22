import { CORAL_WATER_FLOOR_Y } from '../src/game/marineScale'
import { describe, expect, it } from 'vitest'
import { Game } from '../src/game/engine'
import {
  applyDemoPlayQuery,
  applyRomPlayQuery,
  romRouteLevel,
} from '@lib/romPlayQuery'
import { MAP_LEVELS } from '@lib/mapLevels'
import { ORIGINAL_LEVELS } from '../src/game/stageCatalog'

describe('stage catalog and route input', () => {
  it('uses the same original stages in the map and simulation', () => {
    const game = new Game()
    expect(MAP_LEVELS).toBe(ORIGINAL_LEVELS)
    for (const stage of MAP_LEVELS) {
      game.start(stage.id, true)
      expect(game.level).toBe(stage)
    }
  })
  it.each(['NaN', 'Infinity', '-Infinity', 'hello', ''])(
    'keeps demo coordinates finite for %s',
    (value) => {
      const game = new Game()
      applyDemoPlayQuery(
        game,
        new URLSearchParams({ stage: 'boss', x: value, y: value }),
      )
      expect(game.levelId).toBe(6)
      expect(Number.isFinite(game.player.x)).toBe(true)
      expect(Number.isFinite(game.player.y)).toBe(true)
      expect(game.player.x).toBe(game.level.start?.x ?? 3)
    },
  )
  it('bounds finite coordinates and preserves coral preview modes', () => {
    const game = new Game()
    expect(
      applyRomPlayQuery(
        game,
        new URLSearchParams('play=coral&x=999999&y=-999999'),
      ),
    ).toBe(true)
    expect(game.player.x).toBe(game.level.length)
    expect(game.player.y).toBe(CORAL_WATER_FLOOR_Y)
    applyRomPlayQuery(
      game,
      new URLSearchParams('play=coral&depth=deep&x=oops&y=Infinity'),
    )
    expect(game.player.x).toBe(20)
    expect(game.player.y).toBe(1.1)
    applyRomPlayQuery(game, new URLSearchParams('play=coral&depth=shallow'))
    expect(game.player.y).toBe(4.8)
  })
  it.each(['__proto__', 'constructor', 'toString', 'unknown'])(
    'ignores unknown route %s',
    (name) => {
      expect(romRouteLevel(new URLSearchParams({ play: name }))).toBeNull()
    },
  )
  it.each([NaN, Infinity, -Infinity, -1, 0.5])(
    'normalizes invalid stage ID %s',
    (levelId) => {
      const game = new Game()
      game.load(levelId)
      expect(game.levelId).toBe(0)
      expect(game.level.id).toBe(0)
    },
  )
})

describe('coral preview bounds', () => {
  it('preserves valid upper-reef coordinates in the expanded marine stage', () => {
    const game = new Game()
    applyRomPlayQuery(game, new URLSearchParams('play=coral&x=90&y=75'))
    expect(game.player.x).toBe(90)
    expect(game.player.y).toBe(75)
    expect(game.checkpoint.y).toBe(75)
  })
})
