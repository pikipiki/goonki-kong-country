import { ORIGINAL_CAVE_TERRAIN, terrainCellSNES as romCell } from './originalCaveTerrain';
import type { TerrainContact, TerrainOrigin } from './originalCaveTerrain';

/** Gameplay clearance requested after the first horizontal cannon (x=18.75).
 * Remove only the suspended two-tile block at x=[26,28), y=[9.53125,10.5].
 * Keep the extracted ROM metadata intact; rendering and physics share this view.
 */
export function terrainCellSNES(px: number, row: number) {
  if (row === 0 && px >= 26304 && px < 26368) return null;
  return romCell(px, row);
}

export function query(xWorld: number, yWorld: number, origin: TerrainOrigin = { x: 0, y: 0 }) {
  const scale = ORIGINAL_CAVE_TERRAIN.pixelsPerWorldUnit;
  const px = xWorld * scale + origin.x, py = yWorld * scale + origin.y;
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  const referenceRowFromTop = 15 - Math.floor(Math.max(0, Math.min(511, Math.floor(py))) / 32);
  let contact = terrainCellSNES(px, referenceRowFromTop);
  if (contact?.localHeight === 31) {
    contact = terrainCellSNES(px, referenceRowFromTop - 1) ?? contact;
  } else if (!contact) {
    for (let step = 1; step <= 2 && !contact; step++)
      contact = terrainCellSNES(px, referenceRowFromTop + step);
  }
  return contact ? { ...contact, referenceRowFromTop, originalFloorY: contact.floorY,
    floorY: (contact.floorY - origin.y) / scale } satisfies TerrainContact & { originalFloorY: number } : null;
}
