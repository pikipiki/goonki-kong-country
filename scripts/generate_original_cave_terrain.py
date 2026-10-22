"""Generate compact pure TS cave terrain lookup from verified level-tables.json. No ROM read."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
r = json.loads((base / "reference/level-tables.json").read_text())
compact = lambda v: json.dumps(v, separators=(",", ":"))
header = """/** Barrel Cannon Canyon collision metadata (legacy module filename), extracted read-only from USA Rev2.
 * SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
 * Reproduce: python3 scripts/analyze_level_tables.py && python3 scripts/generate_original_cave_terrain.py
 * Jungle environment $D90000; 234 jungle attributes. Verified entrance $17 sets environment 0.
 */
"""
jungle_ts = (base / "src/game/originalTerrain.ts").read_text()
shared_imports = jungle_ts[jungle_ts.index("import {") : jungle_ts.index("const tiles")]
body = jungle_ts[jungle_ts.index("export const ORIGINAL_TERRAIN") :].replace(
    "ORIGINAL_TERRAIN", "ORIGINAL_CAVE_TERRAIN"
)
out = (
    header
    + shared_imports
    + "const tiles: readonly (readonly number[])[] = "
    + compact(r["canyonMetatiles"]["columns"])
    + ";\n"
    + "export const attributes: readonly (readonly number[])[] = "
    + compact(r["jungleCollisionAttributePairs"])
    + ";\n"
    + "export const profiles: readonly (readonly number[])[] = "
    + compact(r["collisionShapeSamples"])
    + ";\n"
    + body
)
out=out.replace("pixelsPerWorldUnit: 32,", "pixelsPerWorldUnit: 32, environmentId: 0,")
(base / "src/game/originalCaveTerrain.ts").write_text(out)
print("Wrote originalCaveTerrain.ts", len(r["canyonMetatiles"]["columns"]), "columns")
