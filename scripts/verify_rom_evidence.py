"""Audit saved local byte observations against the exact user-supplied Rev 2.
Matching bytes verifies the carrier, not the semantic interpretation or execution.
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = '628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527'
path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip')
if path.suffix.lower() == '.zip':
    with zipfile.ZipFile(path) as z:
        members = [n for n in z.namelist() if n.lower().endswith(('.sfc', '.smc'))]
        if len(members) != 1:
            raise ValueError('Expected exactly one ROM member')
        rom = z.read(members[0])
else:
    rom = path.read_bytes()
if len(rom) % 0x8000 == 512:
    rom = rom[512:]
digest = hashlib.sha256(rom).hexdigest()
if digest != EXPECTED:
    raise ValueError('This evidence audit requires the exact identified Rev 2 ROM')

records, reports, missing, covered = [], [], [], set()
def walk(value, source, pointer=''):
    if isinstance(value, dict):
        if isinstance(value.get('fileOffset'), str) and isinstance(value.get('bytes'), str):
            offset = int(value['fileOffset'], 16)
            data = bytes.fromhex(value['bytes'])
            if not data or rom[offset:offset + len(data)] != data:
                raise AssertionError(f'Byte mismatch: {source} {pointer}')
            records.append({'report': source, 'jsonPointer': pointer, 'fileOffset': value['fileOffset'], 'length': len(data)})
            covered.update(range(offset, offset + len(data)))
        for k, v in value.items():
            walk(v, source, f'{pointer}/{k}')
    elif isinstance(value, list):
        for i, v in enumerate(value):
            walk(v, source, f'{pointer}/{i}')

for filename in ['rom-analysis.json', 'buddy-analysis.json', 'player-states.json', 'audio-rom-analysis.json', 'level-tables.json']:
    p = ROOT / 'reference' / filename
    if not p.exists():
        missing.append(filename)
        continue
    raw = p.read_bytes()
    report = json.loads(raw)
    declared = report.get('romSha256')
    if declared and declared != digest:
        raise AssertionError(f'Wrong ROM identity in {filename}')
    before = len(records)
    walk(report, filename)
    reports.append({'file': filename, 'sha256': hashlib.sha256(raw).hexdigest(), 'byteRecordsRechecked': len(records) - before})

result = {
    'romSha256': digest, 'romBytes': len(rom), 'reports': reports,
    'missingReports': missing, 'records': records,
    'uniqueBytesRechecked': len(covered),
    'scope': 'Only explicit fileOffset+bytes observations are rechecked. Decoded data, pointers and other assertions need each producer script and semantic review.',
    'limitations': ['Not complete reverse engineering.', 'No SNES runtime trace or frame parity.', 'Byte coverage is not a measure of semantic analysis completeness.'],
}
(ROOT / 'reference' / 'evidence-audit.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'reports': len(reports), 'recordsRechecked': len(records), 'uniqueBytesRechecked': len(covered), 'missing': missing}))
