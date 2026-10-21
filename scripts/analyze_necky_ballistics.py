"""Extract NutThrowingNecky / NeckyNut ballistics from pinned USA Rev 2 ROM bytes.

Navigation: Yoshifanatic1 DATA_B68EE0 trajectory tables and CODE_B6BB0C nut
impulse helper. Addresses are relocated by unique signatures, not copied from V1.0.
"""
import argparse
import hashlib
import json
import struct
import zipfile
from pathlib import Path

EXPECTED = "628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527"
DEFAULT_ROM = "/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip"
# Unique slice inside relocated DATA_B68EE0 (Rev 2 verified 2026-10).
TRAJ_SIGNATURE = bytes.fromhex(
    "00 07 60 00 20 03 00 07 10 00 e0 fc 00 07 ff ff e2 8e"
)
JUNGLE_RAM_13E9 = 36578  # 0x8EE2 — two bytes into B68EE0 table in V1.0 labels.


def load_rom(path: Path) -> bytes:
    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as z:
            names = [n for n in z.namelist() if n.lower().endswith((".sfc", ".smc"))]
            rom = z.read(names[0])
    else:
        rom = path.read_bytes()
    if len(rom) % 0x8000 == 512:
        rom = rom[512:]
    if hashlib.sha256(rom).hexdigest() != EXPECTED:
        raise SystemExit("ROM SHA-256 mismatch")
    return rom


def locate(rom: bytes, pattern: bytes, label: str) -> int:
    hits = []
    start = 0
    while True:
        i = rom.find(pattern, start)
        if i < 0:
            break
        hits.append(i)
        start = i + 1
    if len(hits) != 1:
        raise SystemExit(f"{label}: expected 1 hit, got {len(hits)} ({hits[:5]}…)")
    return hits[0]


def s16(word: int) -> int:
    return struct.unpack("<h", struct.pack("<H", word & 0xFFFF))[0]


def read_words(rom: bytes, offset: int, count: int = 16) -> list[int]:
    return [struct.unpack_from("<H", rom, offset + i * 2)[0] for i in range(count)]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("rom", nargs="?", default=DEFAULT_ROM)
    ap.add_argument(
        "--output",
        default=str(Path(__file__).resolve().parents[1] / "reference" / "necky-ballistics.json"),
    )
    args = ap.parse_args()
    rom = load_rom(Path(args.rom))
    sig_off = locate(rom, TRAJ_SIGNATURE, "DATA_B68EE0 core")
    table_off = sig_off - 4  # align to $B68EE0 word0 $0010
    words = read_words(rom, table_off, 14)
    # V1.0 spawn script DATA_B591FD sets X=$FED4 Y=$0300 for a thrown nut.
    template_vx, template_vy = -300, 768
    # First motion triple after header words in the jungle table entry (at +2 bytes).
    jungle_off = table_off + 2
    jwords = read_words(rom, jungle_off, 8)
    out = {
        "romSha256": EXPECTED,
        "method": "Rev 2 signature on DATA_B68EE0 body; V1.0 disassembly for semantics.",
        "relocated": {
            "trajectoryTable": {
                "fileOffset": f"0x{table_off:06X}",
                "hiromAddress": f"${0xC00000 + table_off:06X}",
            },
        },
        "jungleHijinxsNutThrowingNecky": {
            "spawnRam13E9": JUNGLE_RAM_13E9,
            "trajectoryFileOffset": f"0x{jungle_off:06X}",
            "spawnRam11A1Frames": 39,
        },
        "trajectoryWords": words,
        "nutSpawnTemplate": {"vxRaw": template_vx, "vyRaw": template_vy},
        "jungleTableSample": {
            "words": jwords,
            "interpretedFirstImpulse": {
                "vxRaw": s16(jwords[3]) if len(jwords) > 3 else None,
                "vyRaw": s16(jwords[4]) if len(jwords) > 4 else None,
            },
        },
        "engine": {
            "gravityRawPerFrame": -112,
            "shootPeriodFrames": 39,
            "flipVxTowardPlayer": True,
            "nutVxRaw": template_vx,
            "nutVyRaw": template_vy,
        },
    }
    Path(args.output).write_text(json.dumps(out, indent=2) + "\n")
    print(json.dumps({"wrote": args.output, "tableOff": f"0x{table_off:06X}"}, indent=2))


if __name__ == "__main__":
    main()
