"""Export dk-walk SNES trace frames for jungle ROM parity tests."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
runtime = json.loads((base / "reference/runtime-player-analysis.json").read_text())
scenarios = runtime["scenarios"]
walk = scenarios["dk-walk"]["trace"][:120]
initial = scenarios["dk-walk"]["initial"]
terrain = scenarios.get("dk-walk-terrain", scenarios["dk-walk"])["trace"]
# SNES dk-walk-terrain: grounded flat walk matches web sim until ~frame 155;
# pit / ledge behaviour near x=454 uses object+state collision not in static metatiles.
dynamic_end = 155
dynamic_frames = [
    {"frame": row["frame"], "x": row["x"], "y": row["y"]}
    for row in terrain
    if row["groundDistance"] == 0 and row["frame"] <= dynamic_end
]
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
    "dynamicParity": {
        "scenario": "dk-walk-terrain",
        "endFrame": dynamic_end,
        "note": "Flat grounded samples before SNES state-17 wall scrunch at x=454; see reference/jungle-walk-pit.md.",
        "frames": dynamic_frames,
    },
    "runtimePit": {
        "maxGroundedSnesX": 454,
        "fallFrame": 200,
        "flatSnesY": 175,
        "staticMetatileFloorContinues": True,
    },
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
