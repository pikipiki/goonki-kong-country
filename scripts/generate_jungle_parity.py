"""Export dk-walk SNES trace frames for jungle ROM parity tests."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
runtime = json.loads((base / "reference/runtime-player-analysis.json").read_text())
trace = runtime["scenarios"]["dk-walk"]["trace"][:48]
initial = runtime["scenarios"]["dk-walk"]["initial"]
out = {
    "scenario": "dk-walk",
    "initialX": initial["x"],
    "initialY": initial["y"],
    "frames": [
        {"frame": row["frame"], "x": row["x"], "vxRaw": row["vxRaw"]}
        for row in trace
    ],
}
(base / "reference/jungle-parity-walk.json").write_text(
    json.dumps(out, indent=2) + "\n"
)
print("Wrote", len(out["frames"]), "parity frames")
