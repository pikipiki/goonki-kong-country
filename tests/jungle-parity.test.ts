import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { ORIGINAL_JUNGLE_ORIGIN } from '../src/game/originalJungle'
import parity from '../reference/jungle-parity-walk.json'
import jungleOmitted from '../reference/jungle-omitted-spawns.json'
import { assertDefined } from './helpers/assertDefined'
const rawSpeed = (value: number) => ((value / 256) * 60) / 32
const rawVelocity = (value: number) => Math.round(value / rawSpeed(1))
const snesYToWorld = (posY: number) => (posY - ORIGINAL_JUNGLE_ORIGIN.y) / 32
function isolatedJungleGame() {
  const game = new Game()
  game.start(0, true)
  game.enemies = []
  game.animals = []
  game.level.barrels.forEach((_, index) => game.usedBarrels.add(index))
  return game
}
describe('jungle ROM walk parity fixture', () => {
  it('replays horizontal motion against SNES dk-walk trace', () => {
    const game = isolatedJungleGame()
    const input = emptyInput()
    input.held.add('right')
    for (const row of parity.walkFrames) {
      const before = game.player.x
      game.update(input)
      expect(rawVelocity(game.player.vx)).toBe(row.vxRaw)
      expect(game.player.x - before).toBeCloseTo(row.vxRaw / 256 / 32, 10)
    }
  })
  it('tracks SNES world X/Y while grounded on the flat intro (dk-walk-terrain)', () => {
    const game = isolatedJungleGame()
    const input = emptyInput()
    input.held.add('right')
    const rows = parity.dynamicParity.frames
    expect(rows.length).toBeGreaterThan(100)
    for (const row of rows) {
      game.update(input)
      expect(game.player.x).toBeCloseTo(row.x / 32, 1)
      expect(game.player.y).toBeCloseTo(snesYToWorld(row.y), 1)
      expect(game.player.grounded).toBe(true)
    }
  })
  it('walks across the rendered lip instead of falling through a synthetic hole', () => {
    const game = isolatedJungleGame()
    const lip = jungleOmitted.runtimePit.webLedgeEndX
    game.player.x = lip - 0.02
    game.player.y = 0
    game.player.grounded = true
    game.player.vy = 0
    const input = emptyInput()
    input.held.add('right')
    for (let index = 0; index < 50; index++) {
      game.update(input)
    }
    expect(game.player.x).toBeGreaterThan(lip + 1)
    expect(game.player.y).toBeGreaterThan(-0.5)
    expect(game.lives).toBe(5)
  })
  it('maps original jungle floor height to SNES ground samples along the walk', () => {
    const game = isolatedJungleGame()
    const terrain = parity.terrainFrames
    for (const row of terrain) {
      const worldX = row.x / 32
      const floor = game.floorAt(worldX, snesYToWorld(row.y))
      expect(floor).not.toBeNull()
      expect(snesYToWorld(row.y)).toBeCloseTo(assertDefined(floor), 2)
    }
  })
})
