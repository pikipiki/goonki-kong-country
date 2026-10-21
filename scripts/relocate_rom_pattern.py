"""Locate a unique byte pattern in the pinned USA Rev 2 ROM (navigation aid).

Use after reading Yoshifanatic1 disassembly or IDA: copy a short instruction
sequence as hex, search the real Rev 2 image — never assume V1.0 file offsets.

Example:
  python3 scripts/relocate_rom_pattern.py "a9 90 ff 18 7d f1 0e"
"""
import argparse
import hashlib
import zipfile
from pathlib import Path

EXPECTED_SHA = "628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527"
DEFAULT_ROM = "/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip"


def load_rom(path: Path) -> bytes:
    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as z:
            names = [n for n in z.namelist() if n.lower().endswith((".sfc", ".smc"))]
            if len(names) != 1:
                raise SystemExit("ZIP must contain exactly one .sfc/.smc")
            data = z.read(names[0])
    else:
        data = path.read_bytes()
    if len(data) % 0x8000 == 512:
        data = data[512:]
    if hashlib.sha256(data).hexdigest() != EXPECTED_SHA:
        raise SystemExit("ROM SHA-256 does not match pinned USA Rev 2")
    return data


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("pattern", help="Space-separated hex bytes")
    ap.add_argument("rom", nargs="?", default=DEFAULT_ROM)
    args = ap.parse_args()
    blob = bytes(int(b, 16) for b in args.pattern.replace(",", " ").split())
    rom = load_rom(Path(args.rom))
    hits = []
    start = 0
    while True:
        i = rom.find(blob, start)
        if i < 0:
            break
        hits.append(i)
        start = i + 1
    if not hits:
        raise SystemExit("Pattern not found in Rev 2")
    if len(hits) > 1:
        print(f"ambiguous ({len(hits)} hits); refine pattern")
        for h in hits[:12]:
            print(f"  file 0x{h:06X}  hirom ${0xC00000 + h:06X}")
        raise SystemExit(1)
    off = hits[0]
    print(f"fileOffset=0x{off:06X}")
    print(f"hiromAddress=${0xC00000 + off:06X}")
    print(f"context={rom[off : off + len(blob)].hex(' ')}")


if __name__ == "__main__":
    main()
