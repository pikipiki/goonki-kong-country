"""Capture actual Rev 2 music through its built-in sound test, not synthesis.
Requires the separately built analysis-only Snes9x bridge and a file-menu state.
Loop candidates use repeated sequencer state; their sample boundary is only
frame-resolved and is explicitly not claimed sample-perfect.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
from snes_probe import SnesProbe

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--core',required=True);parser.add_argument('--state',required=True);parser.add_argument('--rom',default='/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip');parser.add_argument('--output',required=True);parser.add_argument('--ids',default=','.join(str(i) for i in range(27)));parser.add_argument('--max-seconds',type=int,default=240)
    args=parser.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    p=SnesProbe(args.core,args.rom,out);results=[];rate=round(p.av.timing.sample_rate)
    names=json.loads((Path(__file__).resolve().parents[1]/'reference/audio-inventory.json').read_text())['music']
    try:
        for track in [int(x) for x in args.ids.split(',')]:
            p.load(args.state);p.frame=0
            p.write16(0x56B,p.u16(0x56B)|8,'Enable built-in sound-test flag')
            p.write16(0x7A,track,'Select source-verified music ID')
            p.audio.clear();p.run(1,['Select']);p.held=set()
            seen={};candidate=None;last_key=None;onset=None;active_frames=0
            a=p.apuram()
            for frame in range(math.ceil(args.max_seconds*p.av.timing.fps)):
                sample=len(p.audio)//4;p.run(1)
                pointers=p.apu_pointers()
                active=any(a[0x110+i] for i in range(8))
                if active:
                    active_frames+=1
                    if onset is None:onset=sample
                    # Logical music channels only, excluding the independent SFX half.
                    bases=(0x2C,0x3C,0x4C,0x5C,0x6C,0x7C,0x8C,0x9C,0xAC,0xBC,0xCC,0xDC,0x100,0x110)
                    key=bytes(a[b+i] for b in bases for i in range(8))
                    if key != last_key and active_frames>30:
                        if key in seen:
                            first_frame,first_sample=seen[key]
                            if frame-first_frame>p.av.timing.fps*8:
                                candidate={'startSample':first_sample,'endSample':sample,'startSeconds':first_sample/rate,'endSeconds':sample/rate,'periodSeconds':(sample-first_sample)/rate,'method':'Repeated complete selected music-channel state at frame boundaries','samplePerfect':False}
                                # Keep audio past the boundary for listening/comparison.
                                p.run(120)
                                break
                        else:seen[key]=(frame,sample)
                    last_key=key
                elif active_frames>60:
                    p.run(120);break  # Natural end of a jingle, preserve echo tail.
            filename=f'music-{track:02d}.wav';p.wav(out/filename)
            item={'id':track,'name':next((n['name'] for n in names if n['sourceId']==track),str(track)),'file':filename,'pcmSamples':len(p.audio)//4,'seconds':len(p.audio)/4/rate,'observedMusicId':p.u16(0x523),'onsetSample':onset,'loop':candidate,'patches':p.patches[-2:],'wavSha256':hashlib.sha256((out/filename).read_bytes()).hexdigest()}
            if item['observedMusicId']!=track:raise AssertionError('Music selection failed')
            results.append(item)
            meta={'romSha256':p.rom_sha,'coreSha256':hashlib.sha256(p.core_path.read_bytes()).hexdigest(),'stateSha256':hashlib.sha256(Path(args.state).read_bytes()).hexdigest(),'sampleRate':rate,'tracks':results,'limitations':['Captured from Snes9x emulation, not physical SNES.','Sound-test flag and music ID are controlled WRAM changes.','Loop candidates require listening/PCM seam validation; absence of a candidate does not establish non-looping.']}
            (out/'capture.json').write_text(json.dumps(meta,indent=2)+'\n')
            print(json.dumps({'id':track,'seconds':item['seconds'],'loop':candidate}),flush=True)
    finally:p.close()
if __name__=='__main__':main()
