import { afterEach, describe, expect, it, vi } from 'vitest'
import { query as queryCanyon } from '../src/game/canyonTerrain'
import {
  ceilingSNES as ceilingCave,
  ceilingWorld as ceilingWorldCave,
  nearestCandidateBelowSNES as nearestCave,
  probeSNES as probeCave,
  query as queryCave,
  terrainCellSNES as caveCell,
  blocksHorizontalWorld as blocksCave,
} from '../src/game/originalCaveTerrain'
import {
  ceilingCoralWorld,
  probeCoralSNES,
} from '../src/game/originalCoralTerrain'
import {
  ceilingSNES as ceilingMine,
  ceilingWorld as ceilingWorldMine,
  nearestCandidateBelowSNES as nearestMine,
  probeSNES as probeMine,
  query as queryMine,
  terrainCellSNES as mineCell,
  blocksHorizontalWorld as blocksMine,
} from '../src/game/originalMineCartTerrain'
import { assertDefined } from './helpers/assertDefined'
import {
  snesAheadFeetStepUp,
  snesProbeAheadEdgePx,
  snesProbeFootPixelY,
  SNES_PROBE_SCALE,
} from './helpers/snesHorizontalProbe'
import {
  ceilingSNES as ceilingJungle,
  ceilingWorld as ceilingWorldJungle,
  nearestCandidateBelowSNES as nearestJungle,
  probeSNES as probeJungle,
  query as queryJungle,
  blocksHorizontalWorld as blocksJungle,
} from '../src/game/originalTerrain'
afterEach(() => vi.restoreAllMocks())
const caveOrigin = { x: 25472, y: 175 }
const jungleOrigin = { x: 0, y: 175 }
const mineOrigin = { x: 0, y: 175 }
function tryAheadFeetBlock(
  probe: (
    pxRef: number,
    pyRef: number,
  ) => {
    floorY: number
  } | null,
  blocks: (
    posX: number,
    foot: number,
    dir: -1 | 1,
    origin: {
      x: number
      y: number
    },
  ) => boolean,
  origin: {
    x: number
    y: number
  },
  foot: number,
  posX2: number,
  dir: -1 | 1,
) {
  const here = probe(
    posX2 * SNES_PROBE_SCALE + origin.x,
    snesProbeFootPixelY(foot, origin.y),
  )
  if (!here) {
    return null
  }
  const edgePx = snesProbeAheadEdgePx(posX2, dir, origin.x)
  const feetPy = snesProbeFootPixelY(foot, origin.y)
  const aheadFeet = probe(edgePx, feetPy)
  if (aheadFeet && snesAheadFeetStepUp(here.floorY, aheadFeet.floorY)) {
    return { posX2, foot, dir }
  }
  if (blocks(posX2, foot, dir, origin)) {
    return { posX2, foot, dir }
  }
  return null
}
function findAheadFeetBlock(
  probe: (
    pxRef: number,
    pyRef: number,
  ) => {
    floorY: number
  } | null,
  blocks: (
    posX: number,
    foot: number,
    dir: -1 | 1,
    origin: {
      x: number
      y: number
    },
  ) => boolean,
  origin: {
    x: number
    y: number
  },
) {
  for (let foot = -2; foot < 12; foot += 0.25) {
    for (let posX2 = 0; posX2 < 400; posX2 += 0.25) {
      for (const dir of [-1, 1] as const) {
        const hit = tryAheadFeetBlock(probe, blocks, origin, foot, posX2, dir)
        if (hit) {
          return hit
        }
      }
    }
  }
  return null
}
function findProbeStepBelow(pxStart: number, pxEnd: number) {
  for (let pxRef2 = pxStart; pxRef2 < pxEnd; pxRef2 += 8) {
    for (let row = 0; row < 14; row++) {
      const cell = caveCell(pxRef2, row)
      if (cell) {
        continue
      }
      const pyRef2 = (15 - row) * 32 + 8
      if (probeCave(pxRef2, pyRef2)) {
        return { pxRef2, pyRef2 }
      }
    }
  }
  return null
}
describe('terrain probe edge branches', () => {
  it('rejects non-finite SNES coordinates across terrains', () => {
    expect(probeJungle(Number.NaN, 0)).toBeNull()
    expect(probeCave(Number.NaN, 0)).toBeNull()
    expect(probeMine(Number.NaN, 0)).toBeNull()
    expect(nearestJungle(Number.NaN, 0)).toBeNull()
    expect(nearestCave(Number.NaN, 0)).toBeNull()
    expect(nearestMine(Number.NaN, 0)).toBeNull()
    expect(ceilingJungle(Number.NaN, 0)).toBeNull()
    expect(ceilingCave(Number.NaN, 0)).toBeNull()
    expect(ceilingMine(Number.NaN, 0)).toBeNull()
    expect(queryCanyon(Number.NaN, 0, caveOrigin)).toBeNull()
  })
  it('returns null wrappers when probes miss solid cells', () => {
    expect(queryJungle(9000, 9000, jungleOrigin)).toBeNull()
    expect(queryCave(9000, 9000, caveOrigin)).toBeNull()
    expect(queryMine(9000, 9000, mineOrigin)).toBeNull()
    expect(ceilingWorldJungle(9000, -50, jungleOrigin)).toBeNull()
    expect(ceilingWorldCave(9000, -50, caveOrigin)).toBeNull()
    expect(ceilingWorldMine(9000, -50, mineOrigin)).toBeNull()
    expect(ceilingCoralWorld(10, 99999, { x: 0, y: 0 })).toBeNull()
  })
  it('covers mine cart cell guard rails and horizontal ledge branches', () => {
    expect(mineCell(-1, 0)).toBeNull()
    expect(mineCell(0, -1)).toBeNull()
    expect(mineCell(999999, 0)).toBeNull()
    const ahead = findAheadFeetBlock(probeMine, blocksMine, mineOrigin)
    expect(ahead).not.toBeNull()
  })
  it('covers jungle and cave horizontal ledge branches', () => {
    const jungleAhead = findAheadFeetBlock(
      probeJungle,
      blocksJungle,
      jungleOrigin,
    )
    expect(jungleAhead).not.toBeNull()
    const caveAhead = findAheadFeetBlock(probeCave, blocksCave, caveOrigin)
    expect(caveAhead).not.toBeNull()
  })
  it('covers canyon query fallback rows and coral SNES probe', () => {
    const step = findProbeStepBelow(25000, 27000)
    expect(step).not.toBeNull()
    const xWorld = (assertDefined(step).pxRef2 - caveOrigin.x) / 32
    const yWorld = (assertDefined(step).pyRef2 - caveOrigin.y) / 32
    expect(queryCanyon(xWorld, yWorld, caveOrigin)?.floorY).toBeDefined()
    expect(probeCoralSNES(640, 19488)).toBeDefined()
  })
})
