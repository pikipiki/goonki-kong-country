"""Generate compact pure TS terrain lookup from verified level-tables.json. No ROM read."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
r = json.loads((base / "reference/level-tables.json").read_text())
header = """/** Original Jungle Hijinxs collision metadata, extracted read-only from USA Rev2.
 * SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
 * Reproduce source metadata: python3 scripts/analyze_level_tables.py
 * Numeric tables only; no original graphics/music or emulator code.
 * Probe follows verified CODE_81800D / CODE_8180FF and bounded neighbour checks.
 * It does NOT implement player collision resolution, dynamic platforms or hazards.
 */
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

"""
compact = lambda v: json.dumps(v, separators=(",", ":"))
s = header + "const tiles: readonly (readonly number[])[] = " + compact(r["jungleMetatiles"]["columns"]) + ";\n"
s += "export const attributes: readonly (readonly number[])[] = " + compact(r["jungleCollisionAttributePairs"]) + ";\n"
s += "export const profiles: readonly (readonly number[])[] = " + compact(r["collisionShapeSamples"]) + ";\n"
s += """
export const ORIGINAL_TERRAIN = Object.freeze({
  tileSizePixels: SNES_METATILE_SIZE_PX,
  heightPixels: SNES_HORIZONTAL_LEVEL_HEIGHT_PX,
  widthPixels: tiles.length * SNES_METATILE_SIZE_PX,
  pixelsPerWorldUnit: SNES_METATILE_SIZE_PX,
});
export type TerrainContact = HorizontalTerrainCellCore & {
  referenceRowFromTop: number;
};
export type TerrainOrigin = {
  /** Original SNES pixel coordinates corresponding to web world (0, 0). */
  x: number;
  y: number;
};
export function terrainCellSNES(px: number, row: number): Omit<TerrainContact, "referenceRowFromTop"> | null {
  if (row < 0 || row >= SNES_HORIZONTAL_METATILE_ROW_COUNT || px < 0 || px >= ORIGINAL_TERRAIN.widthPixels) return null;
  const tileWord = tiles[Math.floor(px / SNES_METATILE_SIZE_PX)][row];
  return resolveHorizontalTerrainCell(px, row, tileWord, attributes, profiles);
}
/**
 * The original horizontal terrain probe, with bounded adjacent-cell lookup.
 * Y selects a 32px row: an empty row tries at most two rows below; a fully
 * solid (31px) row tries one row above. Other profiles use the selected row.
 * Callers must apply the original collision-resolution policy separately.
 * This intentionally preserves platforms above/below each other.
 */
export function probeSNES(px: number, py: number): TerrainContact | null {
  return probeHorizontalTerrainSNES(px, py, terrainCellSNES);
}
/** World-unit wrapper. The origin must be chosen consistently with level spawn.
 * With origin={x:0,y:175}, original pixel ground175 becomes world floor0.
 */
export function query(xWorld: number, yWorld: number, origin: TerrainOrigin = { x: 0, y: 0 }) {
  const scale = ORIGINAL_TERRAIN.pixelsPerWorldUnit,
    hit = probeSNES(xWorld * scale + origin.x, yWorld * scale + origin.y);
  return hit ? { ...hit, originalFloorY: hit.floorY, floorY: (hit.floorY - origin.y) / scale } : null;
}
/** Diagnostic only: nearest per-tile candidate below Y across all 16 rows.
 * Interior solid cells can appear here; this is not the original neighbour probe.
 */
export function nearestCandidateBelowSNES(px: number, py: number): TerrainContact | null {
  return nearestCandidateBelowHorizontalTerrainSNES(px, py, terrainCellSNES);
}
export function ceilingSNES(px: number, py: number): number | null {
  return ceilingHorizontalTerrainSNES(px, py, terrainCellSNES);
}
export function ceilingWorld(xWorld: number, headWorld: number, origin: TerrainOrigin = { x: 0, y: 0 }) {
  const scale = ORIGINAL_TERRAIN.pixelsPerWorldUnit;
  const hit = ceilingSNES(xWorld * scale + origin.x, headWorld * scale + origin.y);
  return hit === null ? null : (hit - origin.y) / scale;
}
export function blocksHorizontalWorld(
  xWorld: number,
  footWorld: number,
  dir: -1 | 1,
  origin: TerrainOrigin = { x: 0, y: 0 },
) {
  const scale = ORIGINAL_TERRAIN.pixelsPerWorldUnit;
  return blocksHorizontalTerrainWorld(
    (pixelX, pixelY) => probeSNES(pixelX, pixelY),
    scale,
    xWorld,
    footWorld,
    dir,
    origin.x,
    origin.y,
    { checkTorso: true },
  );
}
"""
(base / "src/game/originalTerrain.ts").write_text(s)
