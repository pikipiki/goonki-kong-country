import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import {
  jungleViewport2D,
  bossViewport2D,
  bossCameraLeft,
} from '../src/game2d/camera2D'
import { resolveAudioEffectId } from '../src/game/audio'
import { assertDefined } from './helpers/assertDefined'
describe('2D framing', () => {
  for (const [width, height] of [
    [390, 616],
    [320, 412],
    [844, 390],
    [1280, 720],
  ]) {
    it(`preserves the viewport aspect and readable plushes at ${String(width)}x${String(height)}`, () => {
      const jungle = jungleViewport2D(width, height),
        boss = bossViewport2D(width, height)
      expect(jungle.width / jungle.height).toBeCloseTo(width / height, 2)
      expect(boss.width / boss.height).toBeCloseTo(width / height, 2)
      // Same 62px atlas frame: at least 25% larger than the old portrait
      // jungle camera and 58px on phones in the boss (formerly ~32px).
      if (width < height) {
        expect((62 * width) / jungle.width).toBeGreaterThanOrEqual(
          ((62 * width) / 240) * 1.24,
        )
      }
      const bodyPixels =
        62 * ((boss.width - 32) / boss.worldWidth / 32) * (width / boss.width)
      expect(bodyPixels).toBeGreaterThan(58)
      for (const posX of [1, 3, 9, 17, 21]) {
        const left = bossCameraLeft(posX, boss.worldWidth, 22)
        expect(posX).toBeGreaterThan(left)
        expect(posX).toBeLessThan(left + boss.worldWidth)
        expect(left).toBeGreaterThanOrEqual(-1)
        expect(left + boss.worldWidth).toBeLessThanOrEqual(23)
      }
    })
  }
})
describe('zoomed boss simulation', () => {
  it('keeps the crown attack active when the king starts outside the close camera', () => {
    const game = new Game()
    game.start(6, true)
    game.cameraBounds = { x: 4, y: 2, halfX: 5.5, halfY: 8 }
    for (let index = 0; index < 160; index++) {
      game.update(emptyInput())
    }
    expect(game.bossBattle?.phase).toBe('catch')
    expect(
      game.bossProjectiles.some(
        (pickup) => pickup.kind === 'crown' && pickup.active,
      ),
    ).toBe(true)
  })
})
describe('golden animal tokens', () => {
  function atToken(previous = 0) {
    const game = new Game()
    game.start(0, true)
    game.enemies = []
    const token = assertDefined(
      game.level.decors?.find((decor) => decor.kind === 'token'),
    )
    game.animalTokens.expresso = previous
    Object.assign(game.player, {
      x: token.x,
      y: token.y,
      grounded: false,
      vy: 0,
    })
    return { game, token }
  }
  it('collects the source token once, emits its sound and keeps banana totals unchanged', () => {
    const { game, token } = atToken(),
      events: string[] = []
    game.onEvent = (entry) => events.push(entry)
    const bananas = game.bananas
    game.update(emptyInput())
    expect(game.isTokenCollected(token)).toBe(true)
    expect(game.animalTokens.expresso).toBe(1)
    expect(game.bananas).toBe(bananas)
    expect(
      events.filter((entry2) => entry2.startsWith('animal-token')),
    ).toEqual(['animal-token-1'])
    for (let index2 = 0; index2 < 10; index2++) {
      game.update(emptyInput())
    }
    expect(game.animalTokens.expresso).toBe(1)
    expect(game.level.decors).toContain(token) // Source data remains intact.
  })
  it('requires physical contact, not merely being on the same screen', () => {
    const { game, token } = atToken()
    game.player.x -= 3
    game.update(emptyInput())
    expect(game.isTokenCollected(token)).toBe(false)
    expect(game.animalTokens.expresso).toBe(0)
  })
  it('uses the second and third collection effects, then resets on a fresh run', () => {
    for (const previous of [1, 2]) {
      const { game, token } = atToken(previous),
        events: string[] = []
      game.onEvent = (entry3) => events.push(entry3)
      game.update(emptyInput())
      expect(events).toContain(`animal-token-${String(previous + 1)}`)
      expect(resolveAudioEffectId(`animal-token-${String(previous + 1)}`)).toBe(
        0x60 + previous,
      )
      game.start(0, true)
      expect(game.isTokenCollected(token)).toBe(false)
      expect(game.animalTokens).toEqual({})
    }
  })
  it('keeps collected tokens and their count when entering/leaving a bonus', () => {
    const { game, token } = atToken()
    game.update(emptyInput())
    const room = assertDefined(game.level.bonusRooms)[2],
      wall = assertDefined(game.level.breakableWalls)[room.wallIndex]
    game.brokenWalls.add(room.wallIndex)
    Object.assign(game.player, {
      x: wall.x - 1.1,
      y: wall.y,
      vx: 0,
      vy: 0,
      grounded: true,
    })
    const enter = emptyInput()
    enter.pressed.add('up')
    game.update(enter)
    expect(game.bonus).not.toBeNull()
    game.leaveBonus()
    expect(game.isTokenCollected(token)).toBe(true)
    expect(game.animalTokens.expresso).toBe(1)
  })
})
