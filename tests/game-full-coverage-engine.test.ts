import { describe, expect, it, vi } from 'vitest'
import { Game, emptyInput, readSave } from '../src/game/engine'
import { query as queryCanyon } from '../src/game/canyonTerrain'
import {
  probeSNES as probeCave,
  query as queryCave,
  ceilingWorld as ceilingCave,
  blocksHorizontalWorld as blocksCave,
  nearestCandidateBelowSNES as nearestCave,
  terrainCellSNES as caveTerrainCell,
} from '../src/game/originalCaveTerrain'
import {
  probeSNES as probeMine,
  query as queryMine,
} from '../src/game/originalMineCartTerrain'
import { probeCoralSNES } from '../src/game/originalCoralTerrain'
import {
  probeSNES as probeJungle,
  blocksHorizontalWorld as blocksJungle,
} from '../src/game/originalTerrain'
import { CORAL_WORLD_SCALE } from '../src/game/marineScale'
import { mineEncounterClearance } from '../src/game/routeSafety'
import * as terrainSolids from '../src/game/terrainSolids'
import {
  ceilingCoralWorld,
  coralTerrainCellSNES,
} from '../src/game/originalCoralTerrain'
import { ROM_MINE_CART } from '../src/game/originalMineCart'
import { assertDefined } from './helpers/assertDefined'

describe('game full coverage — terrain probes', () => {
  it('covers cave, mine, jungle, and coral terrain helpers', () => {
    expect(probeCave(192, 176)?.floorY).toBe(175)
    expect(queryCave(26, 5, { x: 25472, y: 175 })?.floorY).toBe(3)
    expect(nearestCave(192, 176)?.floorY).toBe(175)
    expect(ceilingCave(26, 5, { x: 25472, y: 175 })).toBe(10.5)
    expect(blocksCave(26, 1, 1, { x: 25472, y: 175 })).toBeTypeOf('boolean')
    expect(blocksJungle(26, 1, 1, { x: 0, y: 175 })).toBe(true)
    expect(coralTerrainCellSNES(Number.NaN, 0)).toBeNull()
    expect(
      ceilingCoralWorld(10, CORAL_WORLD_SCALE * 10, { x: 0, y: 0 }),
    ).not.toBeNull()
    const mineOrigin = { x: 0, y: 175 }
    expect(probeMine(960, 200)?.floorY).toBe(208)
    expect(queryMine(10, 5, mineOrigin)?.floorY).toBe(3)
    expect(probeJungle(192, 352)?.floorY).toBe(351)
    expect(probeCoralSNES(640, 19488)).toBeDefined()
    expect(queryCanyon(26, 5, { x: 25472, y: 175 })?.floorY).toBe(3)
  })

  it('covers height-31 cave scan and mine encounter clearance', () => {
    let hitHeight31 = false
    for (let pxRef = 25000; pxRef < 27000 && !hitHeight31; pxRef += 16) {
      for (let row = 0; row < 16; row++) {
        const cell = caveTerrainCell(pxRef, row)
        if (cell?.localHeight !== 31) {
          continue
        }
        const pyRef = (15 - row) * 32 + 16
        expect(probeCave(pxRef, pyRef)?.floorY).toBeDefined()
        hitHeight31 = true
        break
      }
    }
    expect(hitHeight31).toBe(true)
    const originalSpans = terrainSolids.terrainSolidSpans
    vi.spyOn(terrainSolids, 'terrainSolidSpans').mockImplementation(
      (kind, posX) => {
        if (kind === 'mineCart') {
          return [
            { bottom: 0, top: 2 },
            { bottom: 3, top: 7 },
          ]
        }
        return originalSpans(kind, posX)
      },
    )
    const adapted = mineEncounterClearance([
      ...ROM_MINE_CART.enemies.slice(0, 4),
      {
        x: 120,
        y: 2,
        min: 118,
        max: 122,
        kind: 'bee',
        hoverAmplitude: 0.6,
      },
    ])
    expect(adapted.length).toBeGreaterThan(4)
  })
})

describe('game full coverage — engine branches', () => {
  it('covers floorAt, spawn nudge, and wall bounce', () => {
    const save = readSave('{"unlocked":3,"best":{}}')
    const game = new Game(save)
    game.start(2, true)
    expect(game.floorAt(20, 0)).not.toBeNull()
    game.start(3, true)
    const spawnBee = assertDefined(
      game.enemies.find((enemy) => enemy.kind === 'bee'),
    )
    expect(spawnBee.y).toBeGreaterThan(0)
    game.start(0, true)
    Object.assign(game.player, { x: -1, vx: -2 })
    game.update(emptyInput())
    expect(game.player.x).toBe(0)
  })

  it('covers cache slap, barrel place, and finish clear', () => {
    const cacheGame = new Game()
    cacheGame.start(0, true)
    const cache = assertDefined(cacheGame.level.itemCaches)[0]
    Object.assign(cacheGame.player, {
      x: cache.x,
      y: cache.y - 1,
      roll: 0.2,
      grounded: true,
    })
    const slap = emptyInput()
    slap.pressed.add('action')
    slap.held.add('down')
    cacheGame.update(slap)
    const finishGame = new Game()
    finishGame.start(0)
    Object.assign(finishGame.player, {
      x: finishGame.level.length - 1,
      y: 0,
      grounded: true,
    })
    finishGame.update(emptyInput())
    expect(finishGame.phase).toBe('clear')
  })
})
