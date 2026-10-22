import { ORIGINAL_MINE_CART_TERRAIN } from '../../game/originalMineCartTerrain'
import { ORIGINAL_MINE_CART_ORIGIN } from '../../game/originalMineCart'
import {
  groundChunkVisibleNearPlayer,
  groundChunkWorldSpan,
} from './groundChunkVisibility'

const CHUNK_COLUMNS = 16
/** Convert absolute ROM columns to the coordinates shared by actors and camera. */
export function mineCartGroundChunkVisible(
  firstColumn: number,
  playerX: number,
  columnCount = CHUNK_COLUMNS,
) {
  const { start, end } = groundChunkWorldSpan(
    firstColumn,
    ORIGINAL_MINE_CART_ORIGIN.x,
    ORIGINAL_MINE_CART_TERRAIN.pixelsPerWorldUnit,
    columnCount,
  )
  return groundChunkVisibleNearPlayer(start, end, playerX)
}
