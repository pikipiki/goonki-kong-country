"""Coral / underwater SNES swim traces → reference/runtime-coral-player.json."""
import json
from pathlib import Path

from probe_player_motion import (
    DEFAULT_CORE,
    DEFAULT_GROUND,
    DEFAULT_WORK,
    SnesProbe,
    digest,
    run_scenario,
    seq,
)

REPORT = Path(__file__).resolve().parents[1] / "reference/runtime-coral-player.json"
CORAL_STATE = DEFAULT_WORK / "runtime-rom/coral/coral-swim.state"
JUNGLE_STATE = DEFAULT_WORK / "runtime-rom/jungle/jungle.state"


def pick_state() -> tuple[Path, str]:
    if CORAL_STATE.is_file():
        return CORAL_STATE, "coral-swim.state (in-level underwater)"
    if JUNGLE_STATE.is_file():
        return JUNGLE_STATE, "jungle.state proxy — capture coral-swim.state for Rev 2 fidelity"
    return DEFAULT_GROUND, "ground.state fallback — not underwater"


def swim_metrics(trace: list[dict]) -> dict:
    vy = [row["vyRaw"] for row in trace]
    y = [row["y"] for row in trace]
    return {
        "frames": len(trace),
        "minVyRaw": min(vy),
        "maxVyRaw": max(vy),
        "lastVyRaw": vy[-1],
        "deltaY": y[-1] - y[0],
        "minGroundDistance": min(row["groundDistance"] for row in trace),
    }


def main() -> None:
    out = (DEFAULT_WORK / "runtime-rom/coral-probe").resolve()
    out.mkdir(parents=True, exist_ok=True)
    rom = "/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip"
    state_path, stateNote = pick_state()
    probe = SnesProbe(DEFAULT_CORE, rom, out)
    probe.record_audio = False
    scenarios = {}
    cases = [
        ("dk-swim-right", seq((120, ["Right"]))),
        ("dk-swim-up", seq((90, ["B"]))),
        ("dk-swim-down", seq((90, ["Down"]))),
        ("dk-swim-up-down", seq((45, ["B"]), (45, ["Down"]))),
    ]
    for name, sequence in cases:
        scenarios[name] = run_scenario(probe, name, state_path, 2, sequence, out, False)
        scenarios[name]["metrics"] = swim_metrics(scenarios[name]["trace"])
    rom_sha = probe.rom_sha
    probe.close()
    report = {
        "romSha256": rom_sha,
        "statePath": str(state_path),
        "stateSha256": digest(state_path),
        "stateNote": stateNote,
        "idealStatePath": str(CORAL_STATE),
        "scenarios": scenarios,
        "limitations": [
            "Prefer work/runtime-rom/coral/coral-swim.state saved in Coral Capers on SNES.",
            "Until that state exists, traces may reflect jungle proxy or ground, not true swim.",
        ],
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"report": str(REPORT), "state": stateNote, "cases": list(scenarios)}, indent=2))


if __name__ == "__main__":
    main()
