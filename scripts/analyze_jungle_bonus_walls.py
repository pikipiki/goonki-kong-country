"""Decode Jungle Hijinxs breakable-wall bonus metadata from level-tables.json."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
tables = json.loads((base / "reference/level-tables.json").read_text())
entrance_to_level = tables.get("entranceToLevelId") or []
records = tables["levels"]["JungleHijinxs"]["spawnList"]["records"]
walls = []
for row in records:
    script = row.get("script") or {}
    if script.get("spriteId") != 20:
        continue
    if row.get("spawnCommand") not in (1, 2):
        continue
    ram = script.get("ramAssignments") or {}
    idx = ram.get("$1375")
    entrance_level_id = None
    if isinstance(idx, int) and 0 <= idx < len(entrance_to_level):
        entrance_level_id = entrance_to_level[idx]
    walls.append(
        {
            "offset": row["offset"],
            "spawnCommand": row["spawnCommand"],
            "x": row["x"],
            "y": row["y"],
            "ram1375": idx,
            "entranceLevelId": entrance_level_id,
            "ram13E9": ram.get("$13E9"),
            "ram1029": ram.get("$1029"),
            "ram145D": ram.get("$145D"),
        }
    )
out = {
    "romSha256": tables["romSha256"],
    "level": "JungleHijinxs",
    "breakableWalls": walls,
    "entranceTableSize": len(entrance_to_level),
    "note": (
        "ram1375 indexes entranceToLevelId in level-tables.json; "
        "entranceLevelId is the byte stored there (bonus target level id). "
        "Room layout and pickups remain authored until Yoshifanatic entrance scripts are replayed."
    ),
}
path = base / "reference/jungle-bonus-walls.json"
path.write_text(json.dumps(out, indent=2) + "\n")
print(f"Wrote {len(walls)} walls to {path}")
