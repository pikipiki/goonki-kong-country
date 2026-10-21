"""Generate Coral Capers underwater collision lookup from level-tables.json."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
r = json.loads((base / "reference/level-tables.json").read_text())
if "underwaterMetatiles" not in r:
    raise SystemExit("Run: python3 scripts/analyze_level_tables.py <Rev2.zip>")

uw = r["underwaterMetatiles"]
origin_y = uw.get("marineLevelOriginY", 17960)
compact = lambda v: json.dumps(v, separators=(",", ":"))
header = f'''/** Coral Capers underwater collision (USA Rev2 environment Underwater / $E90000).
 * Marine SNES Y uses origin {origin_y}: local probe Y = romY - origin within 0..511.
 * Regenerate: npm run analyze:levels && python3 scripts/generate_original_coral_terrain.py
 */
import {{
  attributes,
  profiles,
  type TerrainOrigin,
  type TerrainContact,
}} from "./originalTerrain";

const tiles: readonly (readonly number[])[] = {compact(uw["columns"])};

export const ORIGINAL_CORAL_TERRAIN = Object.freeze({{
  tileSizePixels: 32,
  heightPixels: 512,
  widthPixels: tiles.length * 32,
  pixelsPerWorldUnit: 32,
  marineOriginY: {origin_y},
}});

export function coralTerrainCellSNES(px: number, row: number) {{
  if (row < 0 || row >= 16 || px < 0 || px >= ORIGINAL_CORAL_TERRAIN.widthPixels) return null;
  const tileWord = tiles[Math.floor(px / 32)][row],
    tileId = tileWord & 0x3fff;
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
  return {{
    floorY: (15 - row) * 32 + localHeight,
    x: px,
    rowFromTop: row,
    tileId,
    tileWord,
    attribute,
    correctedAttribute,
    profileFlags: correctedAttribute & 0xc0,
    profileId,
    localHeight,
  }};
}}

const MARINE_BAND_HEIGHT = 512;

export function marineBandLocal(romY: number) {{
  const rel = romY - ORIGINAL_CORAL_TERRAIN.marineOriginY;
  const band = Math.floor(rel / MARINE_BAND_HEIGHT);
  const local = rel - band * MARINE_BAND_HEIGHT;
  return {{ band, local: Math.max(0, Math.min(511, local)) }};
}}

function probeCoralAtRom(px: number, romY: number) {{
  const {{ band }} = marineBandLocal(romY);
  for (const b of [band, band - 1, band + 1]) {{
    if (b < 0) continue;
    const local = romY - ORIGINAL_CORAL_TERRAIN.marineOriginY - b * MARINE_BAND_HEIGHT;
    if (local < 0 || local > 511) continue;
    const hit = probeCoralSNES(px, local);
    if (hit) {{
      return {{
        hit,
        absRomFloor: ORIGINAL_CORAL_TERRAIN.marineOriginY + b * MARINE_BAND_HEIGHT + hit.floorY,
      }};
    }}
  }}
  return null;
}}

export function probeCoralSNES(px: number, py: number): TerrainContact | null {{
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  const y = Math.max(0, Math.min(511, Math.floor(py))),
    referenceRowFromTop = 15 - Math.floor(y / 32);
  let contact = coralTerrainCellSNES(px, referenceRowFromTop);
  if (contact?.localHeight === 31) {{
    const above = coralTerrainCellSNES(px, referenceRowFromTop - 1);
    if (above) contact = above;
  }} else if (!contact) {{
    for (let step = 1; step <= 2; step++) {{
      contact = coralTerrainCellSNES(px, referenceRowFromTop + step);
      if (contact) break;
    }}
  }}
  return contact ? {{ ...contact, referenceRowFromTop }} : null;
}}

/** Web depth Y (0.5 deep .. 5.5 surface) with ROM marine origin on SNES Y axis. */
export function coralRomYFromWeb(yWorld: number) {{
  const span = 1672;
  return ORIGINAL_CORAL_TERRAIN.marineOriginY + (5.5 - yWorld) * (span / 5);
}}

export function coralWebYFromRom(romY: number) {{
  const span = 1672;
  return 5.5 - ((romY - ORIGINAL_CORAL_TERRAIN.marineOriginY) / span) * 5;
}}

export function queryCoral(xWorld: number, yWorld: number, origin: TerrainOrigin) {{
  const scale = ORIGINAL_CORAL_TERRAIN.pixelsPerWorldUnit;
  const romY = coralRomYFromWeb(yWorld);
  const px = xWorld * scale + origin.x;
  const probed = probeCoralAtRom(px, romY);
  if (!probed) return null;
  const floorWeb = coralWebYFromRom(probed.absRomFloor);
  return {{ ...probed.hit, originalFloorY: probed.hit.floorY, floorY: floorWeb }};
}}

export function ceilingCoralWorld(xWorld: number, headWorld: number, origin: TerrainOrigin) {{
  const scale = ORIGINAL_CORAL_TERRAIN.pixelsPerWorldUnit;
  const px = xWorld * scale + origin.x;
  const headRom = coralRomYFromWeb(headWorld);
  const {{ band }} = marineBandLocal(headRom);
  let ceiling: number | null = null;
  for (const b of [band, band + 1]) {{
    if (b < 0) continue;
    const base = ORIGINAL_CORAL_TERRAIN.marineOriginY + b * MARINE_BAND_HEIGHT;
    for (let row = 0; row < 16; row++) {{
      const cell = coralTerrainCellSNES(px, row);
      if (!cell || cell.localHeight < 0) continue;
      const abs = base + cell.floorY;
      if (abs > headRom && (ceiling === null || abs < ceiling)) ceiling = abs;
    }}
  }}
  return ceiling === null ? null : coralWebYFromRom(ceiling);
}}

export function blocksCoralHorizontal(
  xWorld: number,
  footWorld: number,
  dir: -1 | 1,
  origin: TerrainOrigin,
) {{
  const scale = ORIGINAL_CORAL_TERRAIN.pixelsPerWorldUnit;
  const px = xWorld * scale + origin.x;
  const romFoot = coralRomYFromWeb(footWorld);
  const here = probeCoralAtRom(px, romFoot + 6);
  if (!here) return false;
  const edgePx = (xWorld + dir * 0.4) * scale + origin.x;
  const aheadFeet = probeCoralAtRom(edgePx, romFoot + 6);
  if (aheadFeet && aheadFeet.absRomFloor > here.absRomFloor + 10) return true;
  const aheadTorso = probeCoralAtRom(edgePx, romFoot + 38);
  if (aheadTorso && aheadTorso.absRomFloor > romFoot + 12) return true;
  return false;
}}
'''
(base / "src/game/originalCoralTerrain.ts").write_text(header)
