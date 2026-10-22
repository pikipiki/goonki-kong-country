import { expect, it } from 'vitest'
import {
  ceilingSNES as ceilingCave,
  nearestCandidateBelowSNES as nearestCave,
  probeSNES as probeCave,
  terrainCellSNES as caveCell,
  blocksHorizontalWorld as blocksCave,
} from '../src/game/originalCaveTerrain'
import {
  ceilingSNES as ceilingJungle,
  nearestCandidateBelowSNES as nearestJungle,
  probeSNES as probeJungle,
  blocksHorizontalWorld as blocksJungle,
} from '../src/game/originalTerrain'
import {
  nearestCandidateBelowSNES as nearestMine,
  terrainCellSNES as mineCell,
  blocksHorizontalWorld as blocksMine,
} from '../src/game/originalMineCartTerrain'
import {
  snesAheadFeetStepUp,
  snesProbeAheadEdgePx,
  snesProbeFootPixelY,
  SNES_PROBE_SCALE,
} from './helpers/snesHorizontalProbe'

type TerrainOrigin = { x: number; y: number }

function scanHorizontalBlocks(
  blocks: (
    x: number,
    foot: number,
    dir: -1 | 1,
    origin: TerrainOrigin,
  ) => boolean,
  origin: TerrainOrigin,
  maxX: number,
  maxFoot: number,
): boolean {
  for (let foot = 0; foot < maxFoot; foot += 0.5) {
    for (let posX = 0; posX < maxX; posX += 0.5) {
      if (blocks(posX, foot, 1, origin)) {
        return true
      }
    }
  }
  return false
}

function scanAheadFeetLedge(
  probe: (px: number, py: number) => { floorY: number } | null,
  blocks: (
    x: number,
    foot: number,
    dir: -1 | 1,
    origin: TerrainOrigin,
  ) => boolean,
  origin: TerrainOrigin,
): boolean {
  for (let foot = 0; foot < 10; foot += 0.25) {
    for (let posX = 0; posX < 100; posX += 0.25) {
      const here = probe(
        posX * SNES_PROBE_SCALE + origin.x,
        snesProbeFootPixelY(foot, origin.y),
      )
      if (!here) {
        continue
      }
      const edgePx = snesProbeAheadEdgePx(posX, 1, origin.x)
      const feetPy = snesProbeFootPixelY(foot, origin.y)
      const aheadFeet = probe(edgePx, feetPy)
      if (aheadFeet && snesAheadFeetStepUp(here.floorY, aheadFeet.floorY)) {
        expect(blocks(posX, foot, 1, origin)).toBe(true)
        return true
      }
    }
  }
  return false
}

it('returns null diagnostic probes when nothing matches', () => {
  expect(nearestJungle(0, -500)).toBeNull()
  expect(nearestCave(0, -500)).toBeNull()
  expect(nearestMine(0, -500)).toBeNull()
  expect(probeJungle(Number.POSITIVE_INFINITY, 0)).toBeNull()
  expect(probeCave(Number.POSITIVE_INFINITY, 0)).toBeNull()
})
it('covers mine cart cell rejection branches', () => {
  expect(mineCell(0, 20)).toBeNull()
  expect(mineCell(-5, 0)).toBeNull()
})
it('scans ledge branches on jungle and cave columns', () => {
  const origin = { x: 0, y: 175 }
  expect(scanHorizontalBlocks(blocksJungle, origin, 80, 8)).toBe(true)
  const caveOrigin = { x: 25472, y: 175 }
  expect(scanHorizontalBlocks(blocksCave, caveOrigin, 80, 8)).toBe(true)
  let height31WithoutAbove = false
  for (let pxRef = 25000; pxRef < 27000 && !height31WithoutAbove; pxRef += 8) {
    for (let row = 1; row < 16; row++) {
      if (caveCell(pxRef, row)?.localHeight !== 31) {
        continue
      }
      if (!caveCell(pxRef, row - 1)) {
        const pyRef = (15 - row) * 32 + 16
        expect(probeCave(pxRef, pyRef)?.localHeight).toBe(31)
        height31WithoutAbove = true
        break
      }
    }
  }
  expect(height31WithoutAbove).toBe(true)
})
it('covers ceiling scans with interior and ledge columns', () => {
  let caveCeiling = false
  for (let pxRef2 = 25000; pxRef2 < 27000 && !caveCeiling; pxRef2 += 16) {
    const hit = ceilingCave(pxRef2, 200)
    if (hit !== null) {
      caveCeiling = true
    }
  }
  expect(caveCeiling).toBe(true)
  let jungleCeiling = false
  for (let pxRef3 = 0; pxRef3 < 2000 && !jungleCeiling; pxRef3 += 16) {
    if (ceilingJungle(pxRef3, 50) !== null) {
      jungleCeiling = true
    }
  }
  expect(jungleCeiling).toBe(true)
})
it('covers ahead-feet ledge returns without torso blocking', () => {
  const caveOrigin = { x: 25472, y: 175 }
  const origin = { x: 0, y: 175 }
  expect(scanAheadFeetLedge(probeCave, blocksCave, caveOrigin)).toBe(true)
  expect(scanAheadFeetLedge(probeJungle, blocksJungle, origin)).toBe(true)
})
it('covers mine horizontal probe branches', () => {
  const origin = { x: 0, y: 175 }
  expect(scanHorizontalBlocks(blocksMine, origin, 120, 8)).toBe(true)
})
