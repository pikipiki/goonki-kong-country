"""Generate compact pure TS mine-cart terrain lookup from verified level-tables.json. No ROM read."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
r = json.loads((base / "reference/level-tables.json").read_text())
compact = lambda v: json.dumps(v, separators=(",", ":"))
header = """/** Mine Cart Madness collision metadata, extracted read-only from USA Rev2.
 * SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
 * Reproduce: python3 scripts/analyze_level_tables.py && python3 scripts/generate_original_mine_cart_terrain.py
 * Walkway environment $CB0000; 121 attributes at $F00000. Entrance $27 sets environment 2.
 */
"""
jungle_ts = (base / "src/game/originalTerrain.ts").read_text()
body = jungle_ts[jungle_ts.index("export const ORIGINAL_TERRAIN") :].replace(
    "ORIGINAL_TERRAIN", "ORIGINAL_MINE_CART_TERRAIN"
)
out = (
    header
    + "const tiles: readonly (readonly number[])[] = "
    + compact(r["mineCartMetatiles"]["columns"])
    + ";\n"
    + "export const attributes: readonly (readonly number[])[] = "
    + compact(r["mineCartCollisionAttributePairs"])
    + ";\n"
    + "export const profiles: readonly (readonly number[])[] = "
    + compact(r["collisionShapeSamples"])
    + ";\n"
    + body
)
out = out.replace("pixelsPerWorldUnit: 32,", "pixelsPerWorldUnit: 32, environmentId: 2,")
out = out.replace(
    "  const torsoPy = (footWorld + 1) * scale + origin.y;\n"
    "  const aheadFeet = probeSNES(edgePx, feetPy);\n"
    "  if (aheadFeet && aheadFeet.floorY > here.floorY + 10) return true;\n"
    "  const aheadTorso = probeSNES(edgePx, torsoPy);\n"
    "  if (aheadTorso && aheadTorso.floorY > feetPy + 6) return true;\n"
    "  return false;",
    "  const aheadFeet = probeSNES(edgePx, feetPy);\n"
    "  if (aheadFeet && aheadFeet.floorY > here.floorY + 10) return true;\n"
    "  return false;",
)
(base / "src/game/originalMineCartTerrain.ts").write_text(out)
print(
    "Wrote originalMineCartTerrain.ts",
    len(r["mineCartMetatiles"]["columns"]),
    "columns",
)
