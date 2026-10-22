import { describe, it, expect } from 'vitest'
import {
  blocksCoralHorizontal,
  ceilingCoralWorld,
  queryCoral,
} from '../src/game/originalCoralTerrain'
import { ORIGINAL_CORAL_ORIGIN } from '../src/game/originalCoral'
function scanBlocks(posY: number, x0Ref = 2, x1Ref = 62, step = 0.5) {
  const right: number[] = []
  const left: number[] = []
  for (let posX = x0Ref; posX <= x1Ref; posX += step) {
    if (blocksCoralHorizontal(posX, posY, 1, ORIGINAL_CORAL_ORIGIN)) {
      right.push(posX)
    }
    if (blocksCoralHorizontal(posX, posY, -1, ORIGINAL_CORAL_ORIGIN)) {
      left.push(posX)
    }
  }
  return { right, left }
}
describe('coral collision ROM scan (diagnostic)', () => {
  it('reports horizontal block density along common swim lanes', () => {
    for (const posY2 of [2.5, 3.2, 4.0, 5.0]) {
      const { right, left } = scanBlocks(posY2)
      console.log(
        JSON.stringify({
          posY2,
          rightBlocks: right.length,
          leftBlocks: left.length,
          rightSample: right.slice(0, 12),
        }),
      )
    }
    expect(
      scanBlocks(2.5).right.length + scanBlocks(2.5).left.length,
    ).toBeGreaterThanOrEqual(0)
  })
  it('flags phantom floors and low ceilings in open swim columns', () => {
    const phantomFloors: {
      x: number
      swimY: number
      floorY: number
    }[] = []
    const lowCeilings: {
      x: number
      swimY: number
      ceiling: number
    }[] = []
    for (const swimY of [2.8, 3.5, 4.2, 5.0]) {
      for (let posX2 = 2; posX2 <= 62; posX2 += 0.5) {
        const hit = queryCoral(posX2, swimY + 0.08, ORIGINAL_CORAL_ORIGIN)
        if (hit && hit.floorY > swimY + 0.15) {
          phantomFloors.push({ posX2, swimY, floorY: hit.floorY })
        }
        const ceiling = ceilingCoralWorld(
          posX2,
          swimY + 1.35,
          ORIGINAL_CORAL_ORIGIN,
        )
        if (ceiling < swimY + 1.5) {
          lowCeilings.push({ posX2, swimY, ceiling })
        }
      }
    }
    console.log(
      JSON.stringify({
        phantomFloors: phantomFloors.length,
        phantomSample: phantomFloors.slice(0, 15),
        lowCeilings: lowCeilings.length,
        ceilingSample: lowCeilings.slice(0, 15),
      }),
    )
    expect(phantomFloors.length).toBeLessThan(200)
  })
})
import { Game, emptyInput } from '../src/game/engine'
describe('coral swim collision regressions', () => {
  it('swims through mid-depth columns without phantom wall stops', () => {
    const game = new Game()
    game.start(3, true)
    game.enemies = []
    game.player.x = 18
    game.player.y = 3.2
    game.player.vy = 0
    const input = emptyInput()
    input.held.add('right')
    const x0Ref2 = game.player.x
    for (let index = 0; index < 120; index++) {
      game.update(input)
    }
    expect(game.player.x).toBeGreaterThan(x0Ref2 + 2)
  })
})
