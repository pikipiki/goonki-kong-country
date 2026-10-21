"""Small headless libretro frontend for reproducible observation of the supplied ROM.

Build the official libretro/snes9x core separately; no emulator or ROM is shipped
with the browser game. Read reference/runtime-analysis.md for provenance/limits.
"""
import argparse
import ctypes as C
import hashlib
import json
import struct
import wave
import zipfile
import zlib
from pathlib import Path

BUTTONS = dict(B=0, Y=1, Select=2, Start=3, Up=4, Down=5, Left=6, Right=7, A=8, X=9, L=10, R=11)
EXPECTED = '628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527'
class GameInfo(C.Structure):
    _fields_ = [('path', C.c_char_p), ('data', C.c_void_p), ('size', C.c_size_t), ('meta', C.c_char_p)]
class Geometry(C.Structure):
    _fields_ = [('width', C.c_uint), ('height', C.c_uint), ('max_width', C.c_uint), ('max_height', C.c_uint), ('aspect', C.c_float)]
class Timing(C.Structure):
    _fields_ = [('fps', C.c_double), ('sample_rate', C.c_double)]
class AVInfo(C.Structure):
    _fields_ = [('geometry', Geometry), ('timing', Timing)]

ENV = C.CFUNCTYPE(C.c_bool, C.c_uint, C.c_void_p)
VIDEO = C.CFUNCTYPE(None, C.c_void_p, C.c_uint, C.c_uint, C.c_size_t)
AUDIO = C.CFUNCTYPE(None, C.c_int16, C.c_int16)
BATCH = C.CFUNCTYPE(C.c_size_t, C.POINTER(C.c_int16), C.c_size_t)
POLL = C.CFUNCTYPE(None)
INPUT = C.CFUNCTYPE(C.c_int16, C.c_uint, C.c_uint, C.c_uint, C.c_uint)

class SnesProbe:
    def __init__(self, core, rom_path, output):
        self.core_path = Path(core).resolve()
        self.output = Path(output).resolve(); self.output.mkdir(parents=True, exist_ok=True)
        self.lib = C.CDLL(str(self.core_path))
        self.frame = 0; self.held = set(); self.pixel_format = 0
        self.video = None; self.audio = bytearray(); self.record_audio = True
        self.directory = str(self.output).encode()
        self.patches = []
        self.callbacks = [ENV(self.environment), VIDEO(self.video_frame), AUDIO(self.audio_sample), BATCH(self.audio_batch), POLL(lambda: None), INPUT(self.input_state)]
        for setter, cb in zip(['environment','video_refresh','audio_sample','audio_sample_batch','input_poll','input_state'], self.callbacks):
            getattr(self.lib, 'retro_set_' + setter)(cb)
        self.lib.retro_get_memory_data.restype = C.c_void_p
        self.lib.retro_get_memory_size.restype = C.c_size_t
        self.lib.retro_serialize_size.restype = C.c_size_t
        self.lib.retro_serialize.argtypes = [C.c_void_p, C.c_size_t]; self.lib.retro_serialize.restype = C.c_bool
        self.lib.retro_unserialize.argtypes = [C.c_void_p, C.c_size_t]; self.lib.retro_unserialize.restype = C.c_bool
        self.lib.retro_load_game.argtypes = [C.POINTER(GameInfo)]; self.lib.retro_load_game.restype = C.c_bool
        self.lib.retro_init()
        self.lib.retro_set_controller_port_device(0, 1)
        path = Path(rom_path)
        if path.suffix.lower() == '.zip':
            with zipfile.ZipFile(path) as z:
                members = [n for n in z.namelist() if n.lower().endswith(('.sfc','.smc'))]
                if len(members) != 1: raise ValueError('Expected one ROM')
                rom = z.read(members[0])
        else: rom = path.read_bytes()
        if len(rom) % 0x8000 == 512: rom = rom[512:]
        self.rom_sha = hashlib.sha256(rom).hexdigest()
        if self.rom_sha != EXPECTED: raise ValueError('Unexpected ROM identity')
        self.rom_buffer = C.create_string_buffer(rom)
        self.game_info = GameInfo(b'DKC_Rev2.sfc', C.cast(self.rom_buffer,C.c_void_p), len(rom), None)
        if not self.lib.retro_load_game(C.byref(self.game_info)): raise RuntimeError('Core rejected ROM')
        self.av = AVInfo(); self.lib.retro_get_system_av_info(C.byref(self.av))
        size = self.lib.retro_get_memory_size(2)
        if size < 0x20000: raise RuntimeError(f'Unexpected WRAM size {size}')
        self.ram = (C.c_ubyte * size).from_address(self.lib.retro_get_memory_data(2))

    def environment(self, cmd, data):
        base = cmd & 0xFFFF
        if base == 3: C.cast(data,C.POINTER(C.c_bool))[0] = True; return True
        if base in (9,31): C.cast(data,C.POINTER(C.c_char_p))[0] = self.directory; return True
        if base == 10: self.pixel_format = C.cast(data,C.POINTER(C.c_int))[0]; return self.pixel_format in (0,1,2)
        if base == 17: C.cast(data,C.POINTER(C.c_bool))[0] = False; return True
        if base == 52: C.cast(data,C.POINTER(C.c_uint))[0] = 0; return True
        if base == 51: return True  # joypad bitmask support
        if base in (11,16,18,35,36,37,44,53,54,55,67,68,69): return True
        return False

    def video_frame(self, data, width, height, pitch):
        if data: self.video = (C.string_at(data,pitch*height),width,height,pitch,self.pixel_format)
    def audio_sample(self, left, right):
        if self.record_audio: self.audio.extend(struct.pack('<hh',left,right))
    def audio_batch(self, data, frames):
        if self.record_audio: self.audio.extend(C.string_at(data,frames*4))
        return frames
    def input_state(self, port, device, index, button):
        if port or device != 1: return 0
        if button == 256: return sum(1 << i for i in self.held)
        return int(button in self.held)
    def apuram(self):
        if not hasattr(self.lib, 'goonk_apuram'): raise RuntimeError('Build the documented analysis bridge first')
        self.lib.goonk_apuram.restype = C.c_void_p
        return (C.c_ubyte * 65536).from_address(self.lib.goonk_apuram())
    def apu_pointers(self):
        a=self.apuram()
        return [a[0x4C+i] | a[0x5C+i] << 8 for i in range(8)]
    def send_command(self, command, reason):
        # Execute the same port protocol as CODE_8AB1AF without changing ROM.
        for _ in range(30):
            if self.lib.goonk_apuread(0) == self.ram[0]: break
            self.run(1)
        else: raise RuntimeError('APU handshake not ready')
        self.lib.goonk_apuwrite(1, command & 255)
        self.lib.goonk_apuwrite(2, command >> 8)
        previous=self.ram[0]; value=(previous ^ 0x80) | 1
        self.patches.append({'frame':self.frame,'type':'APU port command','command':hex(command),'reason':reason,'handshakeBefore':previous,'handshakeAfter':value})
        self.ram[0]=value; self.lib.goonk_apuwrite(0,value)
    def patch_apu(self, address, value, reason):
        a=self.apuram();self.patches.append({'frame':self.frame,'type':'ARAM byte','address':hex(address),'old':a[address],'new':value,'reason':reason});a[address]=value
    def u16(self, address): return self.ram[address] | self.ram[address+1] << 8
    def s16(self, address):
        v = self.u16(address); return v - 65536 if v & 0x8000 else v
    def state(self):
        # WRAM names are navigation-source hypotheses until corroborated by traces.
        return {'frame':self.frame,'held':[k for k,v in BUTTONS.items() if v in self.held],
            'sprite0':{'x':self.u16(0xB19),'y':self.u16(0xBC1),'vxRaw':self.s16(0xE89),'vyRaw':self.s16(0xEF1),'state':self.u16(0x1029)},
            'sprite2':{'x':self.u16(0xB1B),'y':self.u16(0xBC3),'vxRaw':self.s16(0xE8B),'vyRaw':self.s16(0xEF3),'state':self.u16(0x102B)},
            'musicId':self.u16(0x523),'inputHeldRaw':self.u16(0x500),'inputPressedRaw':self.u16(0x504),'spriteIds':[self.u16(0xD45+i*2) for i in range(4)],'currentKong':self.u16(0x56F),'lives':self.u16(0x575),'bananas':self.u16(0x57B)}
    def run(self, frames, buttons=(), trace=None):
        self.held = {BUTTONS[b] for b in buttons}
        for _ in range(frames):
            self.lib.retro_run(); self.frame += 1
            if trace is not None: trace.append(self.state())
    def save(self, path):
        size = self.lib.retro_serialize_size(); buf = C.create_string_buffer(size)
        if not self.lib.retro_serialize(buf,size): raise RuntimeError('Save failed')
        Path(path).write_bytes(buf.raw)
    def load(self, path):
        raw = Path(path).read_bytes(); buf = C.create_string_buffer(raw)
        if not self.lib.retro_unserialize(buf,len(raw)): raise RuntimeError('Load failed')
        self.ram = (C.c_ubyte * self.lib.retro_get_memory_size(2)).from_address(self.lib.retro_get_memory_data(2))
        self.held = set(); self.audio.clear()
    def write16(self, address, value, reason):
        self.patches.append({'frame':self.frame,'wramAddress':hex(address),'old':self.u16(address),'new':value,'reason':reason})
        self.ram[address] = value & 255; self.ram[address+1] = (value >> 8) & 255
    def screenshot(self, path):
        if not self.video: raise RuntimeError('No frame received')
        data,w,h,pitch,fmt = self.video; rows=[]
        for y in range(h):
            row=bytearray([0])
            for x in range(w):
                if fmt == 1:
                    b,g,r,_ = data[y*pitch+x*4:y*pitch+x*4+4]
                else:
                    v=struct.unpack_from('<H',data,y*pitch+x*2)[0]
                    r=((v>>11)&31)*255//31 if fmt==2 else ((v>>10)&31)*255//31
                    g=((v>>5)&63)*255//63 if fmt==2 else ((v>>5)&31)*255//31
                    b=(v&31)*255//31
                row.extend((r,g,b))
            rows.append(row)
        def chunk(tag, value): return struct.pack('>I',len(value))+tag+value+struct.pack('>I',zlib.crc32(tag+value)&0xFFFFFFFF)
        Path(path).write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b''))
    def wav(self,path):
        with wave.open(str(path),'wb') as f:
            f.setnchannels(2); f.setsampwidth(2); f.setframerate(round(self.av.timing.sample_rate)); f.writeframes(self.audio)
    def close(self): self.lib.retro_unload_game(); self.lib.retro_deinit()

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--core',required=True);parser.add_argument('--rom',default='/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip');parser.add_argument('--output',required=True);parser.add_argument('--scenario',required=True);parser.add_argument('--load')
    args=parser.parse_args();out=Path(args.output);p=SnesProbe(args.core,args.rom,out);trace=[];captures=[]
    try:
        if args.load:p.load(args.load)
        for action in json.loads(Path(args.scenario).read_text()):
            if action.get('clearAudio'):p.audio.clear()
            for patch in action.get('patches',[]):p.write16(int(patch['address'],0),patch['value'],patch['reason'])
            p.run(action.get('frames',1),action.get('buttons',[]),trace)
            if action.get('capture'):
                name=action['capture'];p.screenshot(out/f'{name}.png');captures.append({'name':name,'state':p.state()})
            if action.get('save'):p.save(out/action['save'])
            if action.get('wav'):p.wav(out/action['wav'])
        result={'romSha256':p.rom_sha,'coreSha256':hashlib.sha256(p.core_path.read_bytes()).hexdigest(),'fps':p.av.timing.fps,'sampleRate':p.av.timing.sample_rate,'patches':p.patches,'captures':captures,'trace':trace,'limitations':['Emulator observations, not real SNES hardware.','Unverified WRAM semantic names are hypotheses; inspect trace and images.','State loads or RAM changes must be distinguished from normal play.']}
        (out/'trace.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'frames':p.frame,'captures':captures,'audioSamples':len(p.audio)//4,'fps':p.av.timing.fps}))
    finally:p.close()
if __name__=='__main__':main()
