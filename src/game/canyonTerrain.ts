import {
  ORIGINAL_CAVE_TERRAIN,
  terrainCellSNES as romCell,
} from './originalCaveTerrain'
import type { TerrainContact, TerrainOrigin } from './originalCaveTerrain'
import { probeHorizontalTerrainSNES } from './snesHorizontalTerrainCell'

/** Gameplay clearance after the first horizontal cannon (world x=[26,28)). */
const CANYON_CANNON_CLEARANCE_ROW_FROM_TOP = 0

const CANYON_CANNON_CLEARANCE_PIXEL_X_MIN = 26304

const CANYON_CANNON_CLEARANCE_PIXEL_X_MAX = 26368

/** Gameplay clearance requested after the first horizontal cannon (x=18.75).
 * Remove only the suspended two-tile block at x=[26,28), y=[9.53125,10.5].
 * Keep the extracted ROM metadata intact; rendering and physics share this view.
 */
export function terrainCellSNES(pixelX: number, row: number) {
  if (
    row === CANYON_CANNON_CLEARANCE_ROW_FROM_TOP &&
    pixelX >= CANYON_CANNON_CLEARANCE_PIXEL_X_MIN &&
    pixelX < CANYON_CANNON_CLEARANCE_PIXEL_X_MAX
  ) {
    return null
  }

  return romCell(pixelX, row)
}

export function query(
  xWorld: number,
  yWorld: number,
  origin: TerrainOrigin = { x: 0, y: 0 },
) {
  const scale = ORIGINAL_CAVE_TERRAIN.pixelsPerWorldUnit

  const pixelX = xWorld * scale + origin.x

  const pixelY = yWorld * scale + origin.y

  if (!Number.isFinite(pixelX) || !Number.isFinite(pixelY)) {
    return null
  }

  const contact = probeHorizontalTerrainSNES(pixelX, pixelY, terrainCellSNES)

  if (!contact) {
    return null
  }

  return {
    ...contact,
    originalFloorY: contact.floorY,
    floorY: (contact.floorY - origin.y) / scale,
  } satisfies TerrainContact & { originalFloorY: number }
}
