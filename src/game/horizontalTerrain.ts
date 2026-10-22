import {
  SNES_HORIZONTAL_LEVEL_HEIGHT_PX,
  SNES_HORIZONTAL_METATILE_ROW_COUNT,
  SNES_METATILE_SIZE_PX,
} from './snesCollisionMetatile'
import {
  blocksHorizontalTerrainWorld,
  ceilingHorizontalTerrainSNES,
  nearestCandidateBelowHorizontalTerrainSNES,
  probeHorizontalTerrainSNES,
  resolveHorizontalTerrainCell,
  type HorizontalTerrainCellCore,
} from './snesHorizontalTerrainCell'

export type TerrainContact = HorizontalTerrainCellCore & {
  referenceRowFromTop: number
}
export type TerrainOrigin = {
  /** Original pixel coordinates corresponding to world (0, 0). */
  x: number
  y: number
}
type NumericTable = readonly (readonly number[])[]
export interface HorizontalTerrainDefinition {
  tiles: NumericTable
  attributes: NumericTable
  profiles: NumericTable
  /** Walkway rails only test feet; jungle terrain also checks the torso. */
  checkTorso: boolean
}
const WORLD_ORIGIN: TerrainOrigin = Object.freeze({ x: 0, y: 0 })

/** Bind immutable numeric tables to the same bounded SNES collision queries. */
export function createHorizontalTerrain(
  definition: HorizontalTerrainDefinition,
) {
  const { tiles, checkTorso } = definition
  const scale = SNES_METATILE_SIZE_PX
  const metadata = Object.freeze({
    tileSizePixels: scale,
    heightPixels: SNES_HORIZONTAL_LEVEL_HEIGHT_PX,
    widthPixels: tiles.length * scale,
    pixelsPerWorldUnit: scale,
  })
  const terrainCellSNES = createTerrainCellReader(
    definition,
    metadata.widthPixels,
  )
  /** Preserve empty-row / solid-row neighbour checks and stacked platforms. */
  const probeSNES = (pixelX: number, pixelY: number): TerrainContact | null =>
    probeHorizontalTerrainSNES(pixelX, pixelY, terrainCellSNES)
  const query = (worldX: number, worldY: number, origin = WORLD_ORIGIN) => {
    const hit = probeSNES(worldX * scale + origin.x, worldY * scale + origin.y)
    return hit
      ? {
          ...hit,
          originalFloorY: hit.floorY,
          floorY: (hit.floorY - origin.y) / scale,
        }
      : null
  }
  const nearestCandidateBelowSNES = (
    pixelX: number,
    pixelY: number,
  ): TerrainContact | null =>
    nearestCandidateBelowHorizontalTerrainSNES(pixelX, pixelY, terrainCellSNES)
  const ceilingSNES = (pixelX: number, pixelY: number): number | null =>
    ceilingHorizontalTerrainSNES(pixelX, pixelY, terrainCellSNES)
  const ceilingWorld = (
    worldX: number,
    headWorld: number,
    origin = WORLD_ORIGIN,
  ) => {
    const hit = ceilingSNES(
      worldX * scale + origin.x,
      headWorld * scale + origin.y,
    )
    return hit === null ? null : (hit - origin.y) / scale
  }
  const blocksHorizontalWorld = (
    worldX: number,
    feetWorld: number,
    direction: -1 | 1,
    origin = WORLD_ORIGIN,
  ) =>
    blocksHorizontalTerrainWorld(
      probeSNES,
      scale,
      worldX,
      feetWorld,
      direction,
      origin.x,
      origin.y,
      { checkTorso },
    )
  return {
    metadata,
    terrainCellSNES,
    probeSNES,
    query,
    nearestCandidateBelowSNES,
    ceilingSNES,
    ceilingWorld,
    blocksHorizontalWorld,
  }
}

function createTerrainCellReader(
  definition: HorizontalTerrainDefinition,
  widthPixels: number,
) {
  return (
    pixelX: number,
    row: number,
  ): Omit<TerrainContact, 'referenceRowFromTop'> | null => {
    if (
      row < 0 ||
      row >= SNES_HORIZONTAL_METATILE_ROW_COUNT ||
      pixelX < 0 ||
      pixelX >= widthPixels
    )
      return null
    const { tiles, attributes, profiles } = definition
    const scale = SNES_METATILE_SIZE_PX
    const tileWord = tiles[Math.floor(pixelX / scale)][row]
    return resolveHorizontalTerrainCell(
      pixelX,
      row,
      tileWord,
      attributes,
      profiles,
    )
  }
}
