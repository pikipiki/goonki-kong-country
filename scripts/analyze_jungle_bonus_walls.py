"""Decode Jungle Hijinxs breakable-wall bonus metadata from level-tables.json."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
tables = json.loads((base / "reference/level-tables.json").read_text())
records = tables["levels"]["JungleHijinxs"]["spawnList"]["records"]
walls = []
for row in records:
    script = row.get("script") or {}
    if script.get("spriteId") != 20:
        continue
    if row.get("spawnCommand") not in (1, 2):
        continue
    ram = script.get("ramAssignments") or {}
    walls.append(
        {
            "offset": row["offset"],
            "spawnCommand": row["spawnCommand"],
            "x": row["x"],
            "y": row["y"],
            "ram1375": ram.get("$1375"),
            "ram13E9": ram.get("$13E9"),
            "ram1029": ram.get("$1029"),
            "ram145D": ram.get("$145D"),
        }
    )
out = {
    "romSha256": tables["romSha256"],
    "level": "JungleHijinxs",
    "breakableWalls": walls,
    "note": (
        "$1375 / $13E9 are sprite script fields from ROM spawns; "
        "bonus geometry is not fully decoded — use with Yoshifanatic entrance tables."
    ),
}
path = base / "reference/jungle-bonus-walls.json"
path.write_text(json.dumps(out, indent=2) + "\n")
print(f"Wrote {len(walls)} walls to {path}")
