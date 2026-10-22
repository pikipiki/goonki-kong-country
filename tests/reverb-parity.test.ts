import { describe, expect, it } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'
import { ROM_REVERB } from '../src/game/originalReverb'
import startMeta from '../reference/reverb-start.json'
import parity from '../reference/reverb-parity-walk.json'
const rawSpeed = (value: number) => ((value / 256) * 60) / 32
const rawVelocity = (value: number) => Math.round(value / rawSpeed(1))
function isolatedReverb() {
  const game = new Game()
  game.start(1, true)
  game.enemies = []
  game.animals = []
  game.level.barrels.forEach((_, index) => game.usedBarrels.add(index))
  return game
}
describe('Reverb Cave walk parity', () => {
  it('spawns at world x=0 on probed entrance floor (ROM band 25472)', () => {
    expect(ROM_REVERB.start.x).toBe(0)
    expect(ROM_REVERB.start.y).toBeCloseTo(startMeta.startYWorld, 3)
    const game = isolatedReverb()
    expect(game.player.x).toBe(0)
    expect(game.player.y).toBeCloseTo(startMeta.startYWorld, 3)
    const input = emptyInput()
    input.held.add('right')
    for (let index2 = 0; index2 < 18; index2++) {
      game.update(input)
    }
    // The mesh has a 0.75-unit ledge at the entry: jump over it rather
    // than silently teleporting up through its face.
    input.held.add('jump')
    input.pressed.add('jump')
    for (let index3 = 0; index3 < 25; index3++) {
      game.update(input)
    }
    expect(game.player.x).toBeGreaterThan(0.4)
  })
  it('walks right on flat SNES y=175 strip like jungle', () => {
    const game = isolatedReverb()
    const flatX = startMeta.flatWalkWorldX
    const input = emptyInput()
    input.held.add('right')
    let traveled = 0
    for (let index4 = 0; index4 < 120; index4++) {
      game.player.x = flatX
      game.player.y = 0
      game.player.grounded = true
      game.player.vy = 0
      const before = game.player.x
      game.update(input)
      traveled += game.player.x - before
    }
    expect(traveled).toBeGreaterThan(2)
  })
  it('replays horizontal vx on flat SNES y=175 strip (dk-walk template)', () => {
    const game = isolatedReverb()
    const flatX = startMeta.flatWalkWorldX
    game.player.x = flatX
    game.player.y = 0
    game.player.grounded = true
    game.player.vy = 0
    const input = emptyInput()
    input.held.add('right')
    const frames = parity.walkFrames.slice(0, 120)
    for (const row of frames) {
      game.player.x = flatX
      game.player.y = 0
      game.player.grounded = true
      game.player.vy = 0
      const before = game.player.x
      game.update(input)
      expect(rawVelocity(game.player.vx)).toBe(row.vxRaw)
      expect(game.player.x - before).toBeCloseTo(row.vxRaw / 256 / 32, 10)
      expect(game.player.grounded).toBe(true)
    }
  })
})
