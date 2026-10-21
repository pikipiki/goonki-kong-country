"""Read-only: start band for Mine Cart Carnage (SNES x = first spawn list X)."""
import json
from pathlib import Path

ROM_WORLD_X = 293
Y_ANCHOR = 175
# First rideable track height from ROM mine-cart object row (x=699, y=179).
TRACK_ROM_Y = 179


def main() -> dict:
    base = Path(__file__).resolve().parents[1]
    tables = json.loads((base / "reference/level-tables.json").read_text())
    samples = tables["mineCartCollisionSurfaceSamples"]["samples"]
    by_x = {s["x"]: s["surfaces"] for s in samples}
    surfaces = by_x.get(ROM_WORLD_X) or by_x.get(ROM_WORLD_X - 8) or by_x.get(ROM_WORLD_X + 8)
    probed = max(s["y"] for s in surfaces) if surfaces else TRACK_ROM_Y
    floor_rom = TRACK_ROM_Y if abs(probed - TRACK_ROM_Y) > 48 else probed
    return {
        "romWorldX": ROM_WORLD_X,
        "yAnchor": Y_ANCHOR,
        "startFloorRomY": floor_rom,
        "startYWorld": (floor_rom - Y_ANCHOR) / 32,
        "exitRomX": 14820,
        "exitRomY": 205,
    }


if __name__ == "__main__":
    import sys

    json.dump(main(), sys.stdout, indent=2)
    sys.stdout.write("\n")
