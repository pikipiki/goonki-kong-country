import { SCENE2D_PIXELS_PER_WORLD } from '../../src/game2d/scene2dConstants'
import {
  SNES_HORIZONTAL_WALL_PROBE_FOOT_LIFT,
  SNES_HORIZONTAL_WALL_PROBE_OFFSET_X,
  SNES_HORIZONTAL_WALL_PROBE_TORSO_LIFT,
  SNES_HORIZONTAL_WALL_STEP_UP_THRESHOLD_PX,
  SNES_HORIZONTAL_WALL_TORSO_BLOCK_THRESHOLD_PX,
} from '../../src/game/snesHorizontalTerrainCell'
export const SNES_PROBE_SCALE = SCENE2D_PIXELS_PER_WORLD

export function snesProbeFootPixelY(footWorld: number, originY: number) {
  return (
    (footWorld + SNES_HORIZONTAL_WALL_PROBE_FOOT_LIFT) * SNES_PROBE_SCALE +
    originY
  )
}

export function snesProbeAheadEdgePx(
  xWorld: number,
  dir: -1 | 1,
  originX: number,
) {
  return (
    (xWorld + dir * SNES_HORIZONTAL_WALL_PROBE_OFFSET_X) * SNES_PROBE_SCALE +
    originX
  )
}

export function snesProbeTorsoPixelY(footWorld: number, originY: number) {
  return (
    (footWorld + SNES_HORIZONTAL_WALL_PROBE_TORSO_LIFT) * SNES_PROBE_SCALE +
    originY
  )
}

export function snesAheadFeetStepUp(hereFloorY: number, aheadFloorY: number) {
  return aheadFloorY > hereFloorY + SNES_HORIZONTAL_WALL_STEP_UP_THRESHOLD_PX
}

export function snesAheadTorsoBlocks(
  feetPixelY: number,
  aheadTorsoFloorY: number,
) {
  return (
    aheadTorsoFloorY >
    feetPixelY + SNES_HORIZONTAL_WALL_TORSO_BLOCK_THRESHOLD_PX
  )
}
