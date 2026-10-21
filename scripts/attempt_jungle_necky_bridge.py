"""Try controller patterns past jungle pit; save best state for Necky probes."""
import json
from pathlib import Path

from probe_player_motion import DEFAULT_CORE, DEFAULT_GROUND, DEFAULT_WORK, SnesProbe, sample

OUT = DEFAULT_WORK / "runtime-rom/jungle-necky"
REPORT = Path(__file__).resolve().parents[1] / "reference/necky-bridge-attempts.json"


def attempt(probe, walk_frames: int, mid: list[tuple[int, list[str]]]) -> dict:
    probe.load(DEFAULT_GROUND)
    probe.frame = 0
    probe.patches = []
    max_x = 0
    for _ in range(walk_frames):
        probe.run(1, ["Right"])
        max_x = max(max_x, sample(probe, 2, ["Right"])["x"])
    for frames, buttons in mid:
        for _ in range(frames):
            probe.run(1, buttons)
            max_x = max(max_x, sample(probe, 2, buttons)["x"])
    end = sample(probe, 2, [])
    return {"walkFrames": walk_frames, "mid": mid, "end": end, "maxX": max_x}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rom = "/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip"
    work = DEFAULT_WORK / "runtime-rom/player-motion"
    probe = SnesProbe(DEFAULT_CORE, rom, work)
    patterns = [
        (170, [(15, ["B", "Right"])]),
        (175, [(25, ["B", "Right"])]),
        (178, [(40, ["B", "Right"])]),
        (170, [(10, ["B"]), (60, ["Right"])]),
        (165, [(5, ["B"]), (5, []), (30, ["Right", "B"])]),
    ]
    results = []
    best = None
    for walk_frames, mid in patterns:
        row = attempt(probe, walk_frames, mid)
        results.append(row)
        if best is None or row["end"]["x"] > best["end"]["x"]:
            best = row
    if best:
        probe.load(DEFAULT_GROUND)
        probe.frame = 0
        walk_frames, mid = best["walkFrames"], best["mid"]
        for _ in range(walk_frames):
            probe.run(1, ["Right"])
        for frames, buttons in mid:
            for _ in range(frames):
                probe.run(1, buttons)
        probe.save(OUT / "pit-best-attempt.state")
    probe.close()
    summary = {
        "romSha256": None,
        "attempts": results,
        "best": best,
        "savedState": str(OUT / "pit-best-attempt.state") if best else None,
        "neckyTargetX": 2560,
        "note": "No pattern reached Necky in automated search; use pit-best-attempt.state or manual save past pit.",
    }
    REPORT.write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps({"bestX": best["end"]["x"] if best else None, "report": str(REPORT)}, indent=2))


if __name__ == "__main__":
    main()
