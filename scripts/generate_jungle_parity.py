"""Export dk-walk SNES trace frames for jungle ROM parity tests."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
runtime = json.loads((base / "reference/runtime-player-analysis.json").read_text())
scenarios = runtime["scenarios"]
walk = scenarios["dk-walk"]["trace"][:120]
initial = scenarios["dk-walk"]["initial"]
terrain = scenarios.get("dk-walk-terrain", scenarios["dk-walk"])["trace"]
out = {
    "scenario": "dk-walk",
    "terrainScenario": "dk-walk-terrain" if "dk-walk-terrain" in scenarios else "dk-walk",
    "initialX": initial["x"],
    "initialY": initial["y"],
    "walkFrames": [
        {"frame": row["frame"], "x": row["x"], "vxRaw": row["vxRaw"]}
        for row in walk
    ],
    "terrainFrames": [
        {
            "frame": row["frame"],
            "x": row["x"],
            "y": row["y"],
            "vxRaw": row["vxRaw"],
            "groundDistance": row["groundDistance"],
        }
        for row in terrain
        if row["groundDistance"] == 0
    ],
}
(base / "reference/jungle-parity-walk.json").write_text(
    json.dumps(out, indent=2) + "\n"
)
print(
    "Wrote",
    len(out["walkFrames"]),
    "walk +",
    len(out["terrainFrames"]),
    "terrain-ground frames",
)
