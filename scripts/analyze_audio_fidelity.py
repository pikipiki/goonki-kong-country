"""Compare web audio routing to packaged ROM captures (manifest + engine map)."""
import json
import re
from pathlib import Path

base = Path(__file__).resolve().parents[1]
manifest_path = base / "public/audio/manifest.json"
audio_ts = (base / "src/game/audio.ts").read_text()
out_path = base / "reference/audio-fidelity-report.json"

manifest = json.loads(manifest_path.read_text()) if manifest_path.is_file() else {"effects": {}, "music": {}}
direct = {}
for match in re.finditer(r"'([^']+)':(0x[0-9a-fA-F]+)", audio_ts):
    direct[match.group(1)] = int(match.group(2), 16)

special = {
    "hurt": [0x43, 0x46],
    "letter": [0x4F, 0x50, 0x51, 0x52],
    "jump+enguarde": [0x57],
    "jump+rambi": [0x5F],
    "roll+rambi": [0x56],
    "roll+enguarde": [0x57],
}
effects = manifest.get("effects", {})
wired = []
missing = []
for name, sid in direct.items():
    entry = effects.get(str(sid))
    wired.append({"event": name, "id": sid, "url": entry["url"] if entry else None, "ok": bool(entry)})
    if not entry:
        missing.append({"event": name, "id": sid})

swim_ids = [0x75, 0x76]
swim = [{ "id": i, "present": str(i) in effects, "url": effects.get(str(i), {}).get("url") } for i in swim_ids]

report = {
    "manifestPath": str(manifest_path),
    "wiredDirectEvents": wired,
    "missingCaptures": missing,
    "underwaterSwimEffects": swim,
    "recommendations": [
        "Map lagoon jump to $75 DKSwim / $76 DiddySwim (sfx-water captures).",
        "Run listening compare: original SNES scene vs public/audio/sfx/*.wav.",
    ],
}
out_path.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"report": str(out_path), "missing": len(missing), "swim": swim}, indent=2))
