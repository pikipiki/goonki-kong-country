import { describe, expect, it } from 'vitest'
import {
  query as queryCanyon,
  terrainCellSNES as canyonCell,
} from '../src/game/canyonTerrain'
import {
  blocksHorizontalWorld as blocksCave,
  probeSNES as probeCave,
  terrainCellSNES as caveCell,
} from '../src/game/originalCaveTerrain'
import {
  blocksHorizontalWorld as blocksMine,
  probeSNES as probeMine,
  terrainCellSNES as mineCell,
} from '../src/game/originalMineCartTerrain'
import {
  blocksHorizontalWorld as blocksJungle,
  probeSNES as probeJungle,
  terrainCellSNES as jungleCell,
} from '../src/game/originalTerrain'
import { assertDefined } from './helpers/assertDefined'
import {
  snesAheadFeetStepUp,
  snesAheadTorsoBlocks,
  snesProbeAheadEdgePx,
  snesProbeFootPixelY,
  snesProbeTorsoPixelY,
  SNES_PROBE_SCALE,
} from './helpers/snesHorizontalProbe'
const caveOrigin = { x: 25472, y: 175 }
const jungleOrigin = { x: 0, y: 175 }
function tryTorsoBlock(
  probe: (
    pxRef: number,
    pyRef: number,
  ) => {
    floorY: number
  } | null,
  origin: {
    x: number
    y: number
  },
  foot: number,
  xWorld: number,
  dir: -1 | 1,
) {
  const here = probe(
    xWorld * SNES_PROBE_SCALE + origin.x,
    snesProbeFootPixelY(foot, origin.y),
  )
  if (!here) {
    return null
  }
  const edgePx = snesProbeAheadEdgePx(xWorld, dir, origin.x)
  const feetPy = snesProbeFootPixelY(foot, origin.y)
  const torsoPy = snesProbeTorsoPixelY(foot, origin.y)
  const aheadFeet = probe(edgePx, feetPy)
  if (aheadFeet && snesAheadFeetStepUp(here.floorY, aheadFeet.floorY)) {
    return null
  }
  const aheadTorso = probe(edgePx, torsoPy)
  if (aheadTorso && snesAheadTorsoBlocks(feetPy, aheadTorso.floorY)) {
    return { xWorld, foot, dir }
  }
  return null
}
function torsoBlockCoord(
  probe: (
    pxRef: number,
    pyRef: number,
  ) => {
    floorY: number
  } | null,
  origin: {
    x: number
    y: number
  },
) {
  for (let foot = -2; foot < 15; foot += 0.1) {
    for (let xWorld = 0; xWorld < 350; xWorld += 0.1) {
      for (const dir of [-1, 1] as const) {
        const hit = tryTorsoBlock(probe, origin, foot, xWorld, dir)
        if (hit) {
          return hit
        }
      }
    }
  }
  return null
}
const jungleTorso = torsoBlockCoord(probeJungle, jungleOrigin)
const caveTorso = torsoBlockCoord(probeCave, caveOrigin)
function findHeight31Probe(
  cellAt: (
    pxRef2: number,
    row: number,
  ) => {
    localHeight: number
  } | null,
  probe: (pxRef3: number, pyRef2: number) => unknown,
) {
  for (let pxRef4 = 0; pxRef4 < 5400; pxRef4 += 4) {
    for (let row = 0; row < 16; row++) {
      const cell = cellAt(pxRef4, row)
      if (cell?.localHeight !== 31) {
        continue
      }
      const pyRef3 = (15 - row) * 32 + 16
      expect(probe(pxRef4, pyRef3)).not.toBeNull()
      return true
    }
  }
  return false
}
function findBlockingStep(
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
        if (blocks(posX2, foot, dir, origin)) {
          return { posX2, foot, dir }
        }
      }
    }
  }
  return null
}
describe('terrain probe and ledge branches', () => {
  it('covers canyon query when the row uses the 31px solid profile', () => {
    let hit = false
    for (let pxRef5 = 25000; pxRef5 < 27000 && !hit; pxRef5 += 4) {
      for (let row = 0; row < 16; row++) {
        if (canyonCell(pxRef5, row)?.localHeight !== 31) {
          continue
        }
        const xWorld = (pxRef5 - caveOrigin.x) / 32
        const yWorld = ((15 - row) * 32 + 16 - caveOrigin.y) / 32
        expect(queryCanyon(xWorld, yWorld, caveOrigin)?.floorY).toBeDefined()
        hit = true
        break
      }
    }
    expect(hit).toBe(true)
  })
  it('covers jungle, cave, and mine height-31 probe branches', () => {
    expect(findHeight31Probe(jungleCell, probeJungle)).toBe(true)
    expect(findHeight31Probe(caveCell, probeCave)).toBe(true)
    expect(findHeight31Probe(mineCell, probeMine)).toBe(true)
  })
  it('covers horizontal ledge blocking in extracted terrains', () => {
    expect(findBlockingStep(blocksJungle, jungleOrigin)).not.toBeNull()
    expect(findBlockingStep(blocksCave, caveOrigin)).not.toBeNull()
    expect(findBlockingStep(blocksMine, jungleOrigin)).not.toBeNull()
  })
  it('covers torso-height ledge blocking branches', () => {
    expect(jungleTorso).not.toBeNull()
    expect(caveTorso).not.toBeNull()
    expect(
      blocksJungle(
        assertDefined(jungleTorso).xWorld,
        assertDefined(jungleTorso).foot,
        assertDefined(jungleTorso).dir,
        jungleOrigin,
      ),
    ).toBe(true)
    expect(
      blocksCave(
        assertDefined(caveTorso).xWorld,
        assertDefined(caveTorso).foot,
        assertDefined(caveTorso).dir,
        caveOrigin,
      ),
    ).toBe(true)
  })
})
