import { ORIGINAL_CAVE_TERRAIN } from '../../game/originalCaveTerrain'
import { ORIGINAL_REVERB_ORIGIN } from '../../game/originalReverb'
import {
  groundChunkVisibleNearPlayer,
  groundChunkWorldSpan,
} from './groundChunkVisibility'

const CHUNK_COLUMNS = 16
export function caveGroundChunkVisible(
  firstColumn: number,
  playerX: number,
  columnCount = CHUNK_COLUMNS,
) {
  const { start, end } = groundChunkWorldSpan(
    firstColumn,
    ORIGINAL_REVERB_ORIGIN.x,
    ORIGINAL_CAVE_TERRAIN.pixelsPerWorldUnit,
    columnCount,
  )
  return groundChunkVisibleNearPlayer(start, end, playerX)
}
