"""Read-only Rev2 signature check for the bounded moving-cannon import."""
import hashlib,json,re,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
archive=Path('/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip')
with zipfile.ZipFile(archive) as z:
    target=next(n for n in z.namelist() if n.lower().endswith(('.sfc','.smc')))
    rom=z.read(target)
expected='628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527'
assert hashlib.sha256(rom).hexdigest()==expected
patterns={
 'occupiedMotionEnable':('bd 5d 14 29 02 00 eb 4a 4a 4a 1d 5d 14 9d 5d 14','properties bit2 is shifted into movement-enable bit64 when the cannon becomes ready while occupied.'),
 'rightBound':('b9 e9 13 29 ff 00 18 79 75 13','low byte of packed bounds added to the saved spawn coordinate.'),
 'leftBound':('b9 e9 13 eb 29 ff 00 85 76 b9 75 13 38 e5 76 85 76','high byte of packed bounds subtracted from the saved spawn coordinate.'),
 'motionAxisSelector':('b9 5d 14 29 08 00','property bit8 selects the motion axis during initialization.'),
}
findings={}
for name,(signature,meaning) in patterns.items():
    raw=bytes.fromhex(signature);matches=[m.start() for m in re.finditer(re.escape(raw),rom)]
    assert matches,name
    findings[name]={'signature':signature,'fileOffsets':[f'0x{x:06X}' for x in matches],'meaning':meaning}
report={'romSha256':expected,'method':'Exact byte signature relocation in supplied USA Rev2 ROM; USA1 disassembly used as navigation only. No ROM assets exported.',
 'findings':findings,'boundedConclusion':'The occupied-enable operation and signed-bound arithmetic are present in Rev2. Imported per-spawn values drive the browser movement. Full per-frame state timing and post-shot motion remain adapted.'}
(root/'reference/cannon-motion-evidence.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
