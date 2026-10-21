"""Read-only Rev2 marine grid/attribute/profile extraction. No emulator execution.
Addressing follows CODE_818168 / CODE_81828A, verified against Rev2 bytes.
"""
import hashlib,json,struct,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
with zipfile.ZipFile('/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip') as archive:
 names=[n for n in archive.namelist() if n.lower().endswith(('.sfc','.smc'))]
 assert len(names)==1
 rom=archive.read(names[0])
assert hashlib.sha256(rom).hexdigest()=='628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527'
u16=lambda p:struct.unpack_from('<H',rom,p)[0]
def locate(hexbytes):
 b=bytes.fromhex(hexbytes);p=rom.find(b);assert p>=0 and rom.find(b,p+1)<0;return p
collision=locate('00 00 45 45 c5 c5 ba 05 00 01 00 01 85 85 01 01 00 ba 01 01 01 01 4f 50')
shape=locate('47 85 4b 85 4f 85 53 85 57 85 5b 85 5f 85 63 85 67 85')
marine_shape=shape-0x7e
assert [u16(marine_shape+i*2) for i in range(5)]==[u16(shape+i*2) for i in [0,1,3,5,7]]
# Match the addressing core without relying on the sprite Y field address.
addr=locate('49 ff ff 18 69 00 70 29 e0 ff 0a 0a 18 65 4c a8 20 8a 82')
metadata=json.loads((root/'reference/level-tables.json').read_text())
envs=metadata['environmentData'];attr=int(envs[5]['collisionAttributePointer'][1:],16)&0x3fffff
count=envs[5]['collisionTileCount'];assert count==197
base=int(envs[5]['dataPointer'][1:],16)&0x3fffff
# Reuse already evaluated arithmetic routines, keyed by their actual Rev2 pointer.
known={u16(shape+i*2):samples for i,samples in enumerate(metadata['collisionShapeSamples'])}
profiles=[known[u16(marine_shape+i*2)] for i in range(63)]
ymin,ymax=17920,19680
columns=[[u16(base+(((0x6fff-y)&0xffe0)*4)+x*2) for y in range(ymin,ymax,32)] for x in range(64)]
report={'romSha256':metadata['romSha256'],'evidence':{'marineAddressing':{'offset':hex(addr),'bytes':rom[addr:addr+19].hex(' ')},'tileBase':hex(base),'rowStrideBytes':128,'attributeOffset':hex(attr),'attributeCount':count,'profilePointerOffset':hex(marine_shape)},'originY':17952,'minRomY':ymin,'maxRomYExclusive':ymax,'widthPixels':2048,'storage':'columns[x][ascending ROM Y / 32]; actual source is row-major, 64 tiles per row','columns':columns,'attributes':[[rom[attr+i*2],rom[attr+i*2+1]] for i in range(count)],'profiles':profiles,'limitations':['Static numeric geometry only; not ROM graphics.','Actor start still inferred from existing imported entry, not captured in an emulator.']}
(root/'reference/coral-terrain-v2.json').write_text(json.dumps(report,separators=(',',':'))+'\n')
print(json.dumps(report['evidence']))
print('nonempty tiles',sum(bool(t&0x3fff) and (t&0x3fff)<count for col in columns for t in col),'of',sum(map(len,columns)))
