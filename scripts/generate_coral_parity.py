"""Derive underwater-motion.json vertical targets from runtime-coral-player.json."""
import json
from pathlib import Path

base = Path(__file__).resolve().parents[1]
report_path = base / "reference/runtime-coral-player.json"
motion_path = base / "reference/underwater-motion.json"

if not report_path.is_file():
    raise SystemExit(f"Missing {report_path}; run npm run probe:coral first")

WORLD_PIXELS = 32


def raw_speed_world(raw: int) -> float:
    return (raw / 256) * 60 / WORLD_PIXELS


def cruise_vy(trace: list[dict]) -> float | None:
    samples = [row["vyRaw"] for row in trace if row.get("groundDistance", 0) < 0]
    if not samples:
        return None
    return raw_speed_world(sum(samples) / len(samples))


report = json.loads(report_path.read_text())
motion = json.loads(motion_path.read_text())
scenarios = report.get("scenarios", {})
state_note = report.get("stateNote", "")
trusted = "coral-swim" in state_note.lower()

up = scenarios.get("dk-swim-up", {})
down = scenarios.get("dk-swim-down", {})
right = scenarios.get("dk-swim-right", {})
up_m = up.get("metrics", {})
down_m = down.get("metrics", {})
right_m = right.get("metrics", {})

if up_m.get("maxVyRaw") is not None:
    motion["verticalSwim"]["snesProbe"] = {
        "stateNote": state_note,
        "trustedUnderwater": trusted,
        "upMaxVyRaw": up_m.get("maxVyRaw"),
        "downMinVyRaw": down_m.get("minVyRaw"),
        "rightLastVyRaw": right_m.get("lastVyRaw"),
    }
    motion["verticalSwim"]["note"] = (
        "Horizontal cruise from dk-walk cap; vertical block updated from probe:coral when available."
    )

if trusted:
    up_trace = up.get("trace") or []
    down_trace = down.get("trace") or []
    rise = cruise_vy(up_trace)
    dive = cruise_vy(down_trace)
    if rise is not None:
        motion["verticalSwim"]["riseSpeedWorld"] = round(abs(rise), 3)
    if dive is not None:
        motion["verticalSwim"]["diveSpeedWorld"] = round(abs(dive), 3)
    motion["source"] = "runtime-coral-player.json (coral-swim.state)"

motion_path.write_text(json.dumps(motion, indent=2) + "\n")
print("Updated", motion_path, "trusted=", trusted)
