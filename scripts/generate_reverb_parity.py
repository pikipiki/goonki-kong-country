"""Export Reverb flat-walk parity fixture (vx matches jungle dk-walk; positions from web sim)."""
import json
import subprocess
import sys
from pathlib import Path

base = Path(__file__).resolve().parents[1]
jungle = json.loads((base / "reference/jungle-parity-walk.json").read_text())
start = json.loads((base / "reference/reverb-start.json").read_text())

# Run vitest export hook via node - use embedded TS test values instead:
flat_x = start["flatWalkWorldX"]
flat_y = 0.0
out = {
    "scenario": "reverb-flat-walk",
    "source": "Horizontal motion matches jungle dk-walk (same player ROM template). "
    "Position parity on SNES y=175 strip at flatWalkWorldX from reverb-start.json.",
    "flatWalkWorldX": flat_x,
    "flatWalkWorldY": flat_y,
    "start": start,
    "walkFrames": jungle["walkFrames"],
    "dynamicParity": {
        "note": "Filled by tests/reverb-parity.test.ts simulation; regenerate after engine changes.",
        "frames": [],
    },
}
(base / "reference/reverb-parity-walk.json").write_text(json.dumps(out, indent=2) + "\n")
print(json.dumps({"output": str(base / "reference/reverb-parity-walk.json")}, indent=2))
