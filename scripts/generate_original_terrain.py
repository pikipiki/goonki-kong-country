"""Generate compact pure TS terrain lookup from verified level-tables.json. No ROM read."""
import json
from pathlib import Path
base=Path(__file__).resolve().parents[1]
r=json.loads((base/'reference/level-tables.json').read_text())
header='''/** Original Jungle Hijinxs collision metadata, extracted read-only from USA Rev2.
 * SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
 * Reproduce source metadata: python3 scripts/analyze_level_tables.py
 * Numeric tables only; no original graphics/music or emulator code.
 * Probe follows verified CODE_81800D / CODE_8180FF and bounded neighbour checks.
 * It does NOT implement player collision resolution, dynamic platforms or hazards.
 */
'''
compact=lambda v:json.dumps(v,separators=(',',':'))
s=header+'const tiles: readonly (readonly number[])[] = '+compact(r['jungleMetatiles']['columns'])+';\n'
s+='export const attributes: readonly (readonly number[])[] = '+compact(r['jungleCollisionAttributePairs'])+';\n'
s+='export const profiles: readonly (readonly number[])[] = '+compact(r['collisionShapeSamples'])+';\n'
s+='''
export const ORIGINAL_TERRAIN = Object.freeze({
  tileSizePixels: 32, heightPixels: 512, widthPixels: tiles.length * 32,
  pixelsPerWorldUnit: 32,
});
export type TerrainContact = {
  /** SNES world pixels, Y increases upwards. This may exceed the supplied Y. */
  floorY: number;
  x: number;
  rowFromTop: number;
  tileId: number;
  tileWord: number;
  /** Original left/right half attribute, before horizontal flip correction. */
  attribute: number;
  /** Attribute after original $4000 horizontal flip correction. */
  correctedAttribute: number;
  /** Preserved original high attribute bits; these are NOT fully resolved $9C. */
  profileFlags: number;
  profileId: number;
  localHeight: number;
  referenceRowFromTop: number;
};
export type TerrainOrigin = {
  /** Original SNES pixel coordinates corresponding to web world (0, 0). */
  x: number;
  y: number;
};
export function terrainCellSNES(px: number, row: number): Omit<TerrainContact, "referenceRowFromTop"> | null {
  if (row < 0 || row >= 16 || px < 0 || px >= ORIGINAL_TERRAIN.widthPixels) return null;
  const tileWord = tiles[Math.floor(px / 32)][row], tileId = tileWord & 0x3fff;
  if (tileId === 0 || tileId >= attributes.length) return null;
  let local = Math.floor(px) & 31;
  if (tileWord & 0x4000) local ^= 31;
  const attribute = attributes[tileId][local & 16 ? 1 : 0];
  if (attribute & 0x80) local ^= 15;
  const profileId = attribute & 63;
  if (profileId === 0 || !profiles[profileId]) return null;
  const localHeight = profiles[profileId][local & 15];
  if (localHeight < 0) return null;
  const correctedAttribute = attribute ^ (tileWord & 0x4000 ? 0x80 : 0);
  return { floorY: (15 - row) * 32 + localHeight, x: px,
    rowFromTop: row, tileId, tileWord, attribute, correctedAttribute,
    profileFlags: correctedAttribute & 0xc0, profileId, localHeight };
}
/**
 * The original horizontal terrain probe, with bounded adjacent-cell lookup.
 * Y selects a 32px row: an empty row tries at most two rows below; a fully
 * solid (31px) row tries one row above. Other profiles use the selected row.
 * Callers must apply the original collision-resolution policy separately.
 * This intentionally preserves platforms above/below each other.
 */
export function probeSNES(px: number, py: number): TerrainContact | null {
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  const y = Math.max(0, Math.min(511, Math.floor(py))),
    referenceRowFromTop = 15 - Math.floor(y / 32);
  let contact = terrainCellSNES(px, referenceRowFromTop);
  if (contact?.localHeight === 31) {
    const above = terrainCellSNES(px, referenceRowFromTop - 1);
    if (above) contact = above;
  } else if (!contact) {
    for (let step = 1; step <= 2; step++) {
      contact = terrainCellSNES(px, referenceRowFromTop + step);
      if (contact) break;
    }
  }
  return contact ? { ...contact, referenceRowFromTop } : null;
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
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  let best: Omit<TerrainContact, "referenceRowFromTop"> | null = null;
  for (let row = 0; row < 16; row++) {
    const candidate = terrainCellSNES(px, row);
    if (candidate && candidate.floorY <= py && (!best || candidate.floorY > best.floorY)) best = candidate;
  }
  return best ? { ...best, referenceRowFromTop: 15 - Math.floor(Math.max(0, Math.min(511, py)) / 32) } : null;
}
export function ceilingSNES(px: number, py: number): number | null {
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  let ceiling: number | null = null;
  for (let row = 0; row < 16; row++) {
    const cell = terrainCellSNES(px, row);
    if (!cell || cell.localHeight < 0) continue;
    if (cell.floorY > py && (ceiling === null || cell.floorY < ceiling)) ceiling = cell.floorY;
  }
  return ceiling;
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
  const here = probeSNES(xWorld * scale + origin.x, (footWorld + 0.2) * scale + origin.y);
  if (!here) return false;
  const edgePx = (xWorld + dir * 0.4) * scale + origin.x;
  const feetPy = (footWorld + 0.2) * scale + origin.y;
  const torsoPy = (footWorld + 1) * scale + origin.y;
  const aheadFeet = probeSNES(edgePx, feetPy);
  if (aheadFeet && aheadFeet.floorY > here.floorY + 10) return true;
  const aheadTorso = probeSNES(edgePx, torsoPy);
  if (aheadTorso && aheadTorso.floorY > feetPy + 6) return true;
  return false;
}
'''
(base/'src/game/originalTerrain.ts').write_text(s)
