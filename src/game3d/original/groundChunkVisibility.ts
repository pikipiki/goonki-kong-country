import { WORLD_PIXELS } from '../../game/engine/romPhysics'

export const GROUND_CHUNK_COLUMN_PIXELS = WORLD_PIXELS
export const GROUND_CHUNK_VIEW_PAD_WORLD = 28

export function groundChunkWorldSpan(
  firstColumn: number,
  originXPx: number,
  pixelsPerWorldUnit: number,
  columnCount: number,
) {
  const start =
    (firstColumn * GROUND_CHUNK_COLUMN_PIXELS - originXPx) / pixelsPerWorldUnit
  const end =
    start + (columnCount * GROUND_CHUNK_COLUMN_PIXELS) / pixelsPerWorldUnit
  return { start, end }
}

export function groundChunkVisibleNearPlayer(
  start: number,
  end: number,
  playerX: number,
) {
  return (
    end > playerX - GROUND_CHUNK_VIEW_PAD_WORLD &&
    start < playerX + GROUND_CHUNK_VIEW_PAD_WORLD
  )
}
