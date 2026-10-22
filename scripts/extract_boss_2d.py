#!/usr/bin/env python3
"""Pinned USA Rev2 King K. Rool sprite atlas and control-table evidence.

The community V1 source supplies semantic names only. Every sprite header is
matched against actual supplied Rev2 bytes, and every table signature must be unique.
Background is a separately documented supplied-ROM emulator capture with OBJ disabled.
"""
import argparse,hashlib,json,re,struct,sys,zipfile
from pathlib import Path
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent))
from extract_jungle_2d import decode_dynamic_sprite,read_palette
EXPECTED='628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527'
DEFAULT_SOURCE='/Users/sevenone./Documents/Codex/2026-10-21/cre/work/dkc-disassembly/DKC1/Routine_Macros_DKC1.asm'

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--rom',default='/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip');ap.add_argument('--source',default=DEFAULT_SOURCE)
 ap.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'public/rom2d');ap.add_argument('--evidence',type=Path,default=Path(__file__).resolve().parents[1]/'reference/boss-rom-evidence.json')
 args=ap.parse_args()
 with zipfile.ZipFile(args.rom)as z:rom=z.read(next(n for n in z.namelist()if n.lower().endswith(('.sfc','.smc'))))
 if len(rom)%32768==512:rom=rom[512:]
 assert hashlib.sha256(rom).hexdigest()==EXPECTED
 def locate(pat):
  p=rom.find(pat);assert p>=0 and rom.find(pat,p+1)<0,('Missing/ambiguous',pat.hex(),p);return p
 def word(p):return struct.unpack_from('<H',rom,p)[0]
 def words(p,n):return list(struct.unpack_from('<'+'H'*n,rom,p))
 def hx(p):return f'0x{p:06X}'
 def signature(txt):return locate(bytes.fromhex(txt))
 # Numeric records after initial pointer-bearing entries, exactly matched in Rev2.
 control=signature('0d 13 03 00 89 0e 00 03 d1 10 a8 01 00 00 38 00 0d 13 06 00 41 13 01 00 89 0e 00 03 25 0f 00 01 00 00 4c 00')-0x28
 records=[];off=0
 while True:
  cur=off;assignments={}
  while True:
   register=word(control+off);off+=2
   if register==0:break
   assignments[f'${register:04X}']=word(control+off);off+=2
  next_off=word(control+off);off+=2
  records.append({'offset':hx(control+cur),'relativeOffset':hx(cur),'assignments':assignments,'nextRelativeOffset':next_off})
  if next_off==0:break
  assert next_off==off,(cur,next_off,off)
 throws=[r for r in records if r['assignments'].get('$130D')==3]
 rain=[]
 for sig in ['09 00 00 ff 40 00 60 ff 28 00 28 00 60 ff 90 ff c0 ff f0 ff 20 00','11 00 00 ff 40 00 60 ff 28 00 28 00 a0 00 70 00 40 00 10 00 e0 ff','19 00 00 ff 40 00 60 ff 28 00 28 00 60 ff 90 ff c0 ff f0 ff 20 00']:
  at=signature(sig);n=word(at);header=words(at,6);positions=words(at+12,n)
  rain.append({'offset':hx(at),'count':n,'headerWords':header,'xOffsetsPixels':[x-65536 if x&32768 else x for x in positions],'spawnTimerRawFrames':header[4],'pauseAfterLastRawFrames':header[5]})
 jumps=[]
 for count,sig in [(2,'ef 06 00 0a a5 00 00 04 ac 01 ef 06 00 0a a5 00 00 04 ad 01'),(12,'11 f9 00 0a a5 00 00 04 ac 01 11 f9 00 0a a5 00 00 04 ad 01 77 03')]:
  at=signature(sig);jumps.append({'offset':hx(at),'count':count,'motionWords':[words(at+i*10,5)for i in range(count)]})
 evidence={'romSha256':EXPECTED,'method':'Exact unique numeric signatures in supplied USA Rev2; source V1 semantic navigation; no native65816 decompiler claim. Static decoding, not observed unmodified play.','navigationSource':'https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly','sourceCommit':'c2080f40469c716923f550706509a0d354229841','sourceLabel':'DATA_B6EB45','controlTableOffset':hx(control),'controlRecords':records,'throwCount':len(throws),'throwRecords':throws,'rainTables':rain,'postFakeoutJumpTables':jumps,'adaptation':'Browser reuses sequence families and counts; velocities, hit volumes, room width and timing adapted for unchanged plush sizes and mobile controls. Barrel damage remains a user-requested addition.','limitations':['Full65816 collision/animation execution not emulated by this script.','Nine-versus-ten count is determined from ten explicit state3 throw records, not a remembered walkthrough.','The12-hop table is consumed first6then12 after successivehits; separate2-hop table precedes finalthreewindows.']}
 args.evidence.parent.mkdir(parents=True,exist_ok=True)
 text=Path(args.source).read_text();frames=[];groups={};images=[]
 prefixes={'KRool_Run':'run','KRool_Throw':'throw','KRool_WaitToCatchCrown':'wait','KRool_Idle':'idle','KRool_Hurt':'hurt','KRool_FallOver':'fall','KRool_Jump':'jump','KRoolCrown_Thrown':'crown','Cannonball_Pose':'cannonball','DKIslandInFinalBattle_Pose':'island'}
 headers=[]
 for m in re.finditer(r'DATA_([0-9A-Fa-f]{6}):((?:(?!DATA_).)*?)Graphics/DynamicSprites/GFX_([A-Za-z0-9_]+)\.bin',text,re.S):
  name=m.group(3);group=next((v for k,v in prefixes.items()if name.startswith(k)),None)
  if group is None:continue
  header=bytes(int(h,16)for h in re.findall(r'\$([0-9A-Fa-f]{2})',m.group(2)))
  assert len(header)>=8
  old=int(m.group(1),16)&0x3fffff;at=old if rom[old:old+len(header)]==header else locate(header)
  palette=0xbc829e if group=='cannonball'else 0xbc8262 if group=='island'else 0xbc8314
  result=decode_dynamic_sprite(rom,0xc00000+at,read_palette(rom,palette));assert result is not None
  img,ox,oy=result;images.append((group,img,ox,oy,name));headers.append({'name':name,'group':group,'offset':hx(at),'headerBytes':header.hex(' '),'paletteOffset':hx(palette&0x3fffff)})
 assert len(images)>=40,len(images)
 atlas=Image.new('RGBA',(1024,1024));x=y=rowh=0
 for group,img,ox,oy,name in images:
  if x+img.width>1024:x=0;y+=rowh+2;rowh=0
  assert y+img.height<=1024
  atlas.paste(img,(x,y));idx=len(frames);frames.append({'x':x,'y':y,'w':img.width,'h':img.height,'ox':ox,'oy':oy,'name':name});groups.setdefault(group,[]).append(idx);x+=img.width+2;rowh=max(rowh,img.height)
 groups['getUp']=list(reversed(groups['fall']));groups['rain']=groups['idle']
 args.output.mkdir(parents=True,exist_ok=True);atlas.crop((0,0,1024,y+rowh)).save(args.output/'boss-sprites.png',optimize=True)
 manifest={'romSha256':EXPECTED,'frames':frames,'groups':groups,'spritePalettes':'Color0 implicit transparent;15ROM BGR555 words at source BC8314/BC829E/BC8262.','limitations':['Get-up reuses reverse fall frames; renderer timing adapts original frames to shared browser state.']}
 (args.output/'boss.json').write_text(json.dumps(manifest,indent=2)+'\n');evidence['spriteFrames']=headers;args.evidence.write_text(json.dumps(evidence,indent=2)+'\n')
 print(json.dumps({'throwCount':len(throws),'controlOffset':hx(control),'rains':[r['count']for r in rain],'sprites':len(images),'groups':{k:len(v)for k,v in groups.items()},'output':str(args.output)},indent=2))
if __name__=='__main__':main()
