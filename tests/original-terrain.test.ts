import { describe, expect, it } from 'vitest'
import {
  probeSNES,
  query,
  nearestCandidateBelowSNES,
  ceilingWorld,
  blocksHorizontalWorld,
} from '../src/game/originalTerrain'
describe('original USA Rev2 Jungle collision metadata', () => {
  it('retains distinct levels at the same X instead of flattening to a maximum', () => {
    expect(probeSNES(192, 176)?.floorY).toBe(175)
    expect(probeSNES(192, 352)?.floorY).toBe(351)
    expect(nearestCandidateBelowSNES(192, 176)?.floorY).toBe(175)
  })
  it('finds verified original early floor and sloped Klump terrain', () => {
    expect(probeSNES(528, 176)?.floorY).toBe(175)
    expect(probeSNES(1824, 220)?.floorY).toBe(208)
    expect(probeSNES(1944, 224)?.floorY).toBe(223)
  })
  it('finds the exact Rambi box support pixel beneath its Y144 spawn', () => {
    expect(probeSNES(2952, 144)?.floorY).toBe(143)
  })
  it('maps coordinates with an explicit world origin and no Y inversion', () => {
    const hit = query(528 / 32, 1 / 32, { x: 0, y: 175 })
    expect(hit?.floorY).toBe(0)
    expect(hit?.originalFloorY).toBe(175)
  })
  it('finds the next surface above the head between stacked floors', () => {
    const underside = ceilingWorld(192 / 32, 5, { x: 0, y: 175 })
    expect(underside).toBeCloseTo((351 - 175) / 32, 5)
  })
  it('rejects nonfinite and out-of-extracted-range coordinates', () => {
    expect(probeSNES(-1, 175)).toBeNull()
    expect(probeSNES(5408, 175)).toBeNull()
    expect(probeSNES(NaN, 175)).toBeNull()
  })
  it('blocks stepping into a vertical jungle ledge', () => {
    const origin = { x: 0, y: 175 }
    expect(blocksHorizontalWorld(26, 1, 1, origin)).toBe(true)
  })
})
import {
  ROM_JUNGLE,
  ORIGINAL_JUNGLE_PROVENANCE,
} from '../src/game/originalJungle'
import { createOriginalGroundGeometry } from '../src/game3d/original/jungleGroundGeometry'
describe('original Jungle level and rendering subset', () => {
  it('uses actual four letters and verified Rambi crate without an invented fifth letter', () => {
    expect(
      ROM_JUNGLE.pickups
        .filter((pickup) => pickup.kind === 'letter')
        .map((pickup2) => pickup2.letter)
        .join(''),
    ).toBe('KONG')
    expect(ROM_JUNGLE.animals).toEqual([
      { kind: 'rambi', x: 2952 / 32, y: (144 - 175) / 32 },
    ])
    expect(ROM_JUNGLE.start).toEqual({ x: 156 / 32, y: 0 })
    expect(
      ORIGINAL_JUNGLE_PROVENANCE.imported.length +
        ORIGINAL_JUNGLE_PROVENANCE.omitted.length,
    ).toBe(66)
    expect(
      ROM_JUNGLE.barrels.filter((barrel) => barrel.kind === 'cannon'),
    ).toHaveLength(2)
    expect(
      ROM_JUNGLE.barrels
        .filter((barrel2) => barrel2.kind === 'cannon')
        .every((barrel3) => typeof barrel3.angle === 'number'),
    ).toBe(true)
    expect(ROM_JUNGLE.itemCaches).toHaveLength(17)
    expect(ROM_JUNGLE.breakableWalls).toHaveLength(4)
    expect(ROM_JUNGLE.bonusRooms).toHaveLength(4)
    expect(ROM_JUNGLE.decors?.length).toBeGreaterThanOrEqual(9)
  })
  it('builds real finite 3D terrain retaining both stacked surfaces', () => {
    const geometry = createOriginalGroundGeometry(0, 16),
      position = geometry.attributes.position
    expect(position.count).toBeGreaterThan(0)
    let lower = false,
      upper = false
    for (let index = 0; index < position.count; index++) {
      expect(Number.isFinite(position.getX(index))).toBe(true)
      expect(Number.isFinite(position.getY(index))).toBe(true)
      expect(Number.isFinite(position.getZ(index))).toBe(true)
      if (position.getX(index) === 192 / 32) {
        lower ||= Math.abs(position.getY(index)) < 0.001
        upper ||= Math.abs(position.getY(index) - (351 - 175) / 32) < 0.001
      }
    }
    expect(lower).toBe(true)
    expect(upper).toBe(true)
    geometry.dispose()
  })
})
it('expands original bitmap bananas instead of inventing regular spacing', () => {
  const singles = ROM_JUNGLE.pickups.filter(
    (pickup3) =>
      pickup3.kind === 'banana' &&
      (
        pickup3 as {
          amount?: number
        }
      ).amount === 1,
  )
  expect(singles).toHaveLength(34)
  expect(singles.slice(0, 3).map((pickup4) => [pickup4.x, pickup4.y])).toEqual([
    [228 / 32, 13 / 32],
    [252 / 32, 13 / 32],
    [276 / 32, 13 / 32],
  ])
})
import { ROM_CORAL, ORIGINAL_CORAL_PROVENANCE } from '../src/game/originalCoral'
import { Game, emptyInput } from '../src/game/engine'
import {
  queryCoral,
  marineBandLocal,
  coralRomYFromWeb,
  coralWebYFromRom,
} from '../src/game/originalCoralTerrain'
import { ORIGINAL_CORAL_ORIGIN } from '../src/game/originalCoral'
import {
  coralWorldFromSource as world,
  CORAL_WATER_SURFACE_Y,
} from '../src/game/marineScale'
describe('original Coral Capers placements', () => {
  it('imports verified spawns with KONG letters and Enguarde crates', () => {
    expect(
      ROM_CORAL.pickups
        .filter((pickup5) => pickup5.kind === 'letter')
        .map((pickup6) => pickup6.letter)
        .join(''),
    ).toBe('KONG')
    expect(
      ROM_CORAL.animals?.filter((actor) => actor.kind === 'enguarde'),
    ).toHaveLength(2)
    expect(ORIGINAL_CORAL_PROVENANCE.imported).toHaveLength(37)
    expect(ORIGINAL_CORAL_PROVENANCE.omitted).toHaveLength(0)
    expect(ROM_CORAL.originalTerrain).toBe('coral')
    expect(
      ROM_CORAL.pickups.every(
        (pickup7) => pickup7.y >= world(-1) && pickup7.y <= world(54),
      ),
    ).toBe(true)
  })
  it('probes underwater metatile floors at verified spawn columns', () => {
    const start = queryCoral(world(13), world(5.45), ORIGINAL_CORAL_ORIGIN)
    expect(start?.floorY).toBe(world(4))
    expect(start?.floorY).toBeLessThan(world(6))
  })
  it('maps high ROM Y through 512px marine bands', () => {
    const exitRom = 19632
    const { band, local } = marineBandLocal(exitRom)
    expect(band).toBeGreaterThan(0)
    expect(local).toBeLessThan(512)
    const webY = coralWebYFromRom(exitRom)
    const rom = coralRomYFromWeb(webY)
    expect(marineBandLocal(rom).band).toBe(band)
    const nearExit = queryCoral(world(63), webY, ORIGINAL_CORAL_ORIGIN)
    expect(nearExit === null || nearExit.floorY <= webY + 0.1).toBe(true)
  })
})

describe('original Coral Capers runtime', () => {
  it('imports coral decor signs and buddy token', () => {
    expect(
      ROM_CORAL.decors?.filter((entry) => entry.kind === 'sign'),
    ).toHaveLength(2)
    expect(ROM_CORAL.decors?.some((dist2) => dist2.kind === 'token')).toBe(true)
  })
  it('selects ROM coral when starting lagoon with original route', () => {
    const game = new Game()
    game.start(3, true)
    expect(game.level.name).toBe('levels.romCoral.name')
    expect(game.level.length).toBeCloseTo(world(65.25), 2)
    expect(
      game.enemies.filter((entry) => entry.kind === 'croc').length,
    ).toBeGreaterThan(10)
  })
  it('exposes UnderwaterExitDoor finish zone from ROM', () => {
    expect(ROM_CORAL.finishZone?.x).toBeCloseTo(world(2024 / 32), 3)
    expect(ROM_CORAL.finishZone?.y).toBeCloseTo(world((19488 - 17952) / 32), 2)
  })
  it('does not block horizontal swim at the coral start column', () => {
    const game = new Game()
    game.start(3, true)
    game.enemies = []
    const input = emptyInput()
    input.held.add('right')
    const x0Ref = game.player.x
    for (let index2 = 0; index2 < 40; index2++) {
      game.update(input)
    }
    expect(game.player.x).toBeGreaterThan(x0Ref + 0.8)
    expect(Math.abs(game.player.vx)).toBeGreaterThan(0.5)
  })
  it('swims vertically in coral without interior ceiling crushing the surface band', () => {
    const game = new Game()
    game.start(3, true)
    game.enemies = []
    const input = emptyInput()
    input.held.add('jump')
    const y0Ref = game.player.y
    for (let index3 = 0; index3 < 35; index3++) {
      game.update(input)
    }
    expect(game.player.y).toBeGreaterThan(y0Ref - 0.15)
    expect(game.player.y).toBeLessThanOrEqual(CORAL_WATER_SURFACE_Y)
    input.held.delete('jump')
    input.held.add('down')
    for (let index4 = 0; index4 < 45; index4++) {
      game.update(input)
    }
    expect(game.player.y).toBeLessThan(y0Ref - 0.12)
  })
})
