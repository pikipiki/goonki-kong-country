"""Read-only: floor ROM Y at Reverb playable band start (SNES x = 25472)."""
import json
from pathlib import Path

ROM_WORLD_X = 25472
Y_ANCHOR = 175


def main() -> dict:
    base = Path(__file__).resolve().parents[1]
    tables = json.loads((base / "reference/level-tables.json").read_text())
    samples = tables["canyonCollisionSurfaceSamples"]["samples"]
    by_x = {s["x"]: s["surfaces"] for s in samples}
    px = ROM_WORLD_X
    surfaces = by_x.get(px) or by_x.get(px - 8) or by_x.get(px + 8)
    if not surfaces:
        raise SystemExit(f"No cave surface sample near x={px}")
    floor_rom = max(s["y"] for s in surfaces)
    flat_px = None
    flat_floor = None
    for x in range(ROM_WORLD_X, ROM_WORLD_X + 512, 8):
        surf = by_x.get(x)
        if not surf:
            continue
        top = max(s["y"] for s in surf)
        if top == Y_ANCHOR:
            flat_px = x
            flat_floor = top
            break
    return {
        "romWorldX": ROM_WORLD_X,
        "yAnchor": Y_ANCHOR,
        "startFloorRomY": floor_rom,
        "startYWorld": (floor_rom - Y_ANCHOR) / 32,
        "flatWalkRomX": flat_px,
        "flatWalkFloorRomY": flat_floor,
        "flatWalkWorldX": (flat_px - ROM_WORLD_X) / 32 if flat_px else None,
    }


if __name__ == "__main__":
    import sys

    json.dump(main(), sys.stdout, indent=2)
    sys.stdout.write("\n")
