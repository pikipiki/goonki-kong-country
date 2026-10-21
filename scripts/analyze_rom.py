"""Read-only, reproducible analysis of the user-supplied USA Rev 2 SNES ROM.
Only signatures found in the actual bytes are emitted as verified observations.
The public USA 1.0 disassembly was used as a navigation aid, not assumed to match.
No ROM, sprites or music are redistributed by this script.
"""
import hashlib, json, struct, sys, zipfile
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv)>1 else Path('/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip')
if path.suffix.lower()=='.zip':
    with zipfile.ZipFile(path) as archive:
        names=[n for n in archive.namelist() if n.lower().endswith(('.sfc','.smc'))]
        if len(names)!=1: raise ValueError('Expected exactly one ROM')
        rom=archive.read(names[0])
else: rom=path.read_bytes()
if len(rom)%0x8000==512: rom=rom[512:]
if len(rom)!=0x400000 or rom[0xffc0:0xffd5]!=b'DONKEY KONG COUNTRY  ': raise ValueError('Unexpected ROM layout')

def hits(hex_bytes):
    pattern=bytes.fromhex(hex_bytes); result=[]; pos=0
    while True:
        pos=rom.find(pattern,pos)
        if pos<0: return result
        result.append({'fileOffset':f'0x{pos:06X}','hiromAddress':f'${0xC00000+pos:06X}','bytes':pattern.hex(' ')})
        pos+=1

signatures={
 'gravity': ('a9 90 ff 18 7d f1 0e 10 08 c9 00 f8 b0 03 a9 00 f8 9d f1 0e 60',
   'LDA #$FF90; CLC; ADC $0EF1,X; BPL +8; CMP #$F800; BCS +3; LDA #$F800; STA $0EF1,X; RTS',
   {'accelerationRaw':-112,'terminalVelocityRaw':-2048,'fractionBits':8}),
 'heldJump': ('a9 b8 ff c0 00 00 f0 03 a9 a6 ff 99 f9 16',
   'LDA #$FFB8; CPY #$0000; BEQ +3; LDA #$FFA6; STA $16F9,Y',
   {'pinkGravityRaw':-72,'violetGravityRaw':-90}),
 'enemyBounce': ('a9 20 07 e0 02 00 f0 03 a9 80 08 9d f1 0e',
   'LDA #$0720; CPX #$0002; BEQ +3; LDA #$0880; STA $0EF1,X',
   {'pinkBounceRaw':1824,'violetBounceRaw':2176}),
 'bananaLife': ('ad 7b 05 38 e9 64 00 8d 7b 05',
   'LDA $057B; SEC; SBC #$0064; STA $057B', {'bananasPerLife':100}),
 'characterEntry': ('a9 02 00 85 84 80 02 64 84',
   'LDA #$0002; STA $84; BRA +2; STZ $84', {'characterSelectors':[0,2]}),
}
findings={}
for name,(pattern,asm,values) in signatures.items():
    matches=hits(pattern)
    if not matches: raise AssertionError(f'Unverified pattern: {name}')
    findings[name]={'verified':True,'matches':matches,'disassembly':asm,'values':values}
header={'title':rom[0xffc0:0xffd5].decode('ascii').strip(),'mapMode':hex(rom[0xffd5]),
        'romBytes':len(rom),'sramBytes':2**(rom[0xffd8]+10),'region':rom[0xffd9],
        'revision':rom[0xffdb],'checksum':hex(struct.unpack_from('<H',rom,0xffde)[0]),
        'checksumComplement':hex(struct.unpack_from('<H',rom,0xffdc)[0]),
        'computedChecksum':hex(sum(rom)&0xffff),'resetVector':hex(struct.unpack_from('<H',rom,0xfffc)[0])}
report={'romSha256':hashlib.sha256(rom).hexdigest(),'header':header,'findings':findings,
 'method':'Byte-pattern relocation against supplied Rev 2, followed by manual 65C816 decoding; fixed-point interpretation cross-checked with position-integration routines.',
 'navigationSource':'https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly',
 'limitations':['No SNES execution or frame-perfect verification.','Not a complete decompilation.','Level geometry, enemy AI, initial jump impulse, animations and audio of the web adaptation are newly authored.','Verified bytes establish these local routines, not every game state in which they execute.']}
out=Path(__file__).resolve().parents[1]/'reference'/'rom-analysis.json'
out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
