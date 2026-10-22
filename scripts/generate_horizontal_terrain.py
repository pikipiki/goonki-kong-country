"""Reproduce numeric JSON collision tables; query algorithms remain maintained TS.
Source: reference/level-tables.json, produced by analyze_level_tables.py.
Never edits gameplay code or reads the ROM directly.
"""
import json
from pathlib import Path

STAGES = {
    "jungle": ("jungleMetatiles", "jungleCollisionAttributePairs", "jungle"),
    "canyon": ("canyonMetatiles", "jungleCollisionAttributePairs", "jungle"),
    "mine-cart": ("mineCartMetatiles", "mineCartCollisionAttributePairs", "mine-cart"),
}


def generate(stage):
    base = Path(__file__).resolve().parents[1]
    reference = json.loads((base / "reference/level-tables.json").read_text())
    tile_key, attribute_key, attribute_name = STAGES[stage]
    destination = base / "src/game/data"
    destination.mkdir(parents=True, exist_ok=True)
    tables = {
        f"{stage}-tiles": reference[tile_key]["columns"],
        f"{attribute_name}-attributes": reference[attribute_key],
        "collision-profiles": reference["collisionShapeSamples"],
    }
    for name, values in tables.items():
        # One row per line stays readable without expanding each number vertically.
        rows = ["  " + json.dumps(row, separators=(", ", ": ")) for row in values]
        (destination / f"{name}.json").write_text("[\n" + ",\n".join(rows) + "\n]\n")
    print(f"Generated {stage}: {len(tables[f'{stage}-tiles'])} columns")


if __name__ == "__main__":
    for stage in STAGES:
        generate(stage)
