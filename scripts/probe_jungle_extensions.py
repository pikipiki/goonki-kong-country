"""Extra Jungle SNES traces merged into runtime-player-analysis.json (no RAM patches)."""
import hashlib
import json
from pathlib import Path

from probe_player_motion import (
    DEFAULT_CORE,
    DEFAULT_GROUND,
    DEFAULT_WORK,
    SnesProbe,
    digest,
    run_scenario,
    sample,
    seq,
)

REPORT = Path(__file__).resolve().parents[1] / "reference/runtime-player-analysis.json"
NECKY_STATE = DEFAULT_WORK / "runtime-rom/jungle-necky/necky-approach.state"


def scan_sprites(probe: SnesProbe) -> list[dict]:
    found = []
    for slot in range(2, 512, 2):
        sid = probe.u16(0x0D45 + slot)
        if sid == 0:
            continue
        found.append(
            {
                "slot": slot,
                "spriteId": sid,
                "x": probe.u16(0x0B19 + slot),
                "y": probe.u16(0x0BC1 + slot),
                "vxRaw": probe.s16(0x0E89 + slot),
                "vyRaw": probe.s16(0x0EF1 + slot),
            }
        )
    return found


def run_necky_watch(probe: SnesProbe, state_path: Path, out: Path) -> dict:
    probe.load(state_path)
    probe.frame = 0
    probe.patches = []
    # Pit near x≈454 blocks a straight walk to NutThrowingNecky (x≈2560); jumps TBD.
    sequence = seq((300, ["Right"]), (60, []))
    rows = []
    nut_frames = []
    for action in sequence:
        for _ in range(action["frames"]):
            probe.run(1, action["buttons"])
            row = sample(probe, 2, action["buttons"])
            sprites = scan_sprites(probe)
            row["sprites"] = sprites
            rows.append(row)
            nuts = [
                s
                for s in sprites
                if s["spriteId"] == 16
                and 0 < s["x"] < 5500
                and 0 < s["y"] < 512
                and (abs(s["vxRaw"]) > 0 or abs(s["vyRaw"]) > 0)
                and row["x"] >= 2400
            ]
            if nuts:
                nut_frames.append(
                    {
                        "frame": row["frame"],
                        "playerX": row["x"],
                        "playerY": row["y"],
                        "nuts": nuts,
                    }
                )
    result = {
        "name": "dk-necky-watch",
        "startStateSha256": digest(state_path),
        "sequence": sequence,
        "patches": list(probe.patches),
        "trace": rows,
        "nutEvents": nut_frames,
        "summary": {
            "nutEventCount": len(nut_frames),
            "firstNutFrame": nut_frames[0]["frame"] if nut_frames else None,
        },
    }
    (out / "dk-necky-watch.json").write_text(json.dumps(result, indent=2) + "\n")
    probe.screenshot(out / "dk-necky-watch-last.png")
    if probe.patches:
        raise AssertionError("Unintended RAM modification during necky watch")
    return result


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--necky-state", type=Path, default=NECKY_STATE)
    args = parser.parse_args()
    out = (DEFAULT_WORK / "runtime-rom/player-motion").resolve()
    out.mkdir(parents=True, exist_ok=True)
    rom = "/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip"
    probe = SnesProbe(DEFAULT_CORE, rom, out)
    probe.record_audio = False
    report = json.loads(REPORT.read_text())
    scenarios = report["scenarios"]
    scenarios["dk-walk-terrain"] = run_scenario(
        probe,
        "dk-walk-terrain",
        DEFAULT_GROUND,
        2,
        seq((300, ["Right"])),
        out,
        False,
    )
    necky_state = args.necky_state if args.necky_state.is_file() else DEFAULT_GROUND
    scenarios["dk-necky-watch"] = run_necky_watch(probe, necky_state, out)
    scenarios["dk-necky-watch"]["neckyStatePath"] = str(necky_state)
    report["scenarios"] = scenarios
    report["jungleExtensionNote"] = (
        "dk-walk-terrain: 300f hold Right for slope samples; "
        "dk-necky-watch: approach NutThrowingNecky and record spriteId 16 nuts."
    )
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    necky_out = Path(__file__).resolve().parents[1] / "reference/necky-runtime-capture.json"
    nut_events = scenarios["dk-necky-watch"]["nutEvents"]
    necky_doc = {
        "romSha256": report["romSha256"],
        "scenario": scenarios["dk-necky-watch"]["summary"],
        "nutEvents": nut_events,
    }
    if not nut_events:
        necky_doc["limitations"] = [
            "Straight Right from ground.state reaches the pit near x≈454 before NutThrowingNecky (x=2560).",
            "Use a mid-level save state or a scripted jump route for live nut traces.",
            "Static ballistics: reference/necky-ballistics.json.",
        ]
    necky_out.write_text(json.dumps(necky_doc, indent=2) + "\n")
    print(
        json.dumps(
            {
                "report": str(REPORT),
                "terrainFrames": len(scenarios["dk-walk-terrain"]["trace"]),
                "nutEvents": scenarios["dk-necky-watch"]["summary"],
            },
            indent=2,
        )
    )
    probe.close()


if __name__ == "__main__":
    main()
