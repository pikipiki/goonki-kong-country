"""Capture real Rev 2 SFX through the existing Snes9x analysis frontend.

Controlled setup: redirect music channels to the game's own END instruction,
allow echo to decay, then send actual CPU/APU port commands. No DSP replacement,
synthetic sound generation or ROM changes. Sound banks remain those of --state.
"""
import argparse
import array
import hashlib
import json
import math
import struct
from pathlib import Path
from snes_probe import SnesProbe


def pcm_stats(data):
    samples = array.array('h', data)
    return {'frames': len(samples) // 2, 'peak': max((abs(x) for x in samples), default=0),
            'rms': math.sqrt(sum(x*x for x in samples) / max(1, len(samples)))}


def audio_state(p):
    a = p.apuram()
    return {'musicPositions': p.apu_pointers(),
            'musicActive': list(a[0x110:0x118]), 'sfxActive': list(a[0x118:0x120]),
            'sfxPositions': [a[0x54+i] | a[0x64+i] << 8 for i in range(8)],
            'duration': list(a[0x3C:0x4C]), 'loopStackIndices': list(a[0xDC:0xEC]),
            'pitchSrcnVoice4': [p.lib.goonk_apudsp(x) for x in (0x42, 0x43, 0x44)],
            'apuPc': p.lib.goonk_apupc()}


def referenced_instruments(a, sound_id):
    """Bounded control-flow interpreter for instrument dependencies, not sound.

    Parameter widths come from the verified driver's 49-entry command table.
    A visited state establishes repeated control flow, not a measured PCM loop.
    """
    lengths = [1, 2, 3, 3, 4, 1, 2, 1, 6, 6, 1, 2, 2, 4, 1, 5,
               3, 3, 2, 2, 2, 4, 1, 1, 9, 2, 1, 1, 5, 5, 5, 5,
               5, 1, 1, 1, 1, 1, 5, 5, 4, 2, 2, 1, 1, 0, 2, 5, 1]
    pc = a[0x2380+sound_id*2] | a[0x2381+sound_id*2] << 8
    duration = 0; wide = False; branch = a[0xED]; stack = []; seen = set(); instruments = set()
    def word(at): return a[at] | a[at+1] << 8
    for step in range(20000):
        state = (pc, duration, wide, branch, tuple(stack))
        if state in seen: return sorted(instruments), 'repeated control state', step
        seen.add(state)
        if not 0x246E <= pc < 0x31A6: return sorted(instruments), 'outside SFX sequence bank', step
        op = a[pc]
        if op >= 0x80:
            pc += 1 if duration else 3 if wide else 2
            continue
        if op >= len(lengths): return sorted(instruments), f'unknown opcode {op:02X}', step
        if op == 0: return sorted(instruments), 'END', step
        if op in (1, 40): instruments.add(a[pc+1])
        if op == 3: pc = word(pc+1); continue
        if op == 4:
            if len(stack) >= 8: return sorted(instruments), 'stack capacity exceeded', step
            stack.append((pc, a[pc+1] or 256)); pc = word(pc+2); continue
        if op == 5:
            if not stack: return sorted(instruments), 'repeat without call', step
            call, left = stack.pop()
            if left > 1: stack.append((call, left-1)); pc = word(call+2)
            else: pc = call+4
            continue
        if op == 6: duration = a[pc+2] if wide else a[pc+1]; pc += 3 if wide else 2; continue
        if op == 7: duration = 0
        if op == 43: wide = True
        if op == 44: wide = False
        if op == 45: pc = word(pc+1+branch*2); continue
        if op == 46: branch = a[pc+1]
        pc += lengths[op]
    return sorted(instruments), 'instruction limit', 20000


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--core', required=True)
    parser.add_argument('--state', required=True)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--rom', default='/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip')
    parser.add_argument('--ids', default='0x21,0x14,0x58', help='Comma separated decimal or 0x hex IDs, or all for 0..118')
    parser.add_argument('--frames', default=180, type=int)
    parser.add_argument('--settle', default=180, type=int)
    parser.add_argument('--channel', default=4, type=int, choices=range(8))
    parser.add_argument('--no-pause', action='store_true', help='Use only with a source state that cannot emit competing gameplay sounds')
    parser.add_argument('--silence-tolerance', default=0, type=int, help='Explicit maximum settled PCM peak; default requires exact zero')
    args = parser.parse_args()
    ids = list(range(119)) if args.ids == 'all' else [int(x, 0) for x in args.ids.split(',')]
    if any(not 0 <= value < 119 for value in ids): raise ValueError('SFX ID must be 0..118')
    args.output.mkdir(parents=True, exist_ok=True)
    p = SnesProbe(args.core, args.rom, args.output)
    try:
        p.load(args.state)
        if not args.no_pause:
            # Let the game's initial pause debounce expire, then use its real input.
            p.run(60)
            if not p.u16(0x579) & 0x40:
                p.patches.append({'frame': p.frame, 'type': 'controller setup', 'buttons': ['Start'], 'reason': 'Pause actual gameplay to suppress ambient/game sound commands during isolated SFX capture'})
                p.run(1, ['Start']); p.run(5)
            if not p.u16(0x579) & 0x40: raise RuntimeError('Source state did not enter game pause')
        a = p.apuram()
        if bytes(a[0x5E8:0x5EC]) != bytes.fromhex('20 cd ff bd'): raise ValueError('Unexpected SPC driver')
        end_pointer = a[0x2380] | a[0x2381] << 8
        if end_pointer != 0x2FB4 or a[end_pointer] != 0: raise ValueError('None SFX must point to verified END opcode')
        original = audio_state(p)
        for i in range(16):
            for offset, value in ((0x4C+i, end_pointer & 255), (0x5C+i, end_pointer >> 8), (0x3C+i, 1), (0x2C+i, 0)):
                p.patch_apu(offset, value, 'Controlled capture: redirect existing music/SFX stream to authentic END opcode; retain driver and instruments')
        p.audio.clear(); p.run(args.settle)
        quiet = audio_state(p)
        if any(quiet['musicActive']): raise RuntimeError('Music END sequence did not stop all channels')
        baseline_data = p.audio[-32040*4:]
        baseline = pcm_stats(baseline_data)
        if baseline['peak'] > args.silence_tolerance: raise RuntimeError(f'Settled baseline exceeds tolerance: {baseline}; do not publish contaminated captures')
        p.wav(args.output / 'settling-baseline.wav')
        p.save(args.output / 'silenced.state')
        # Verify instrument availability by comparing actual ARAM bytes to ROM
        # payloads. Nonzero mapping entries can be stale from previous songs.
        rom = p.rom_buffer.raw[:-1]
        availability = {}
        for sample_id in range(70):
            header = int.from_bytes(rom[0x9FF00+sample_id*3:0x9FF03+sample_id*3], 'little') & 0x3FFFFF
            _, size = struct.unpack_from('<HH', rom, header)
            slot = a[0x4E8+sample_id]
            start = a[0x3200+slot*4] | a[0x3201+slot*4] << 8
            availability[sample_id] = bytes(a[start:start+size]) == rom[header+4:header+4+size]
        initial_patches = list(p.patches)
        results = []
        for sound_id in ids:
            p.load(args.output / 'silenced.state'); p.patches = []
            p.audio.clear()
            instruments, parse_status, steps = referenced_instruments(p.apuram(), sound_id)
            p.send_command(args.channel << 8 | sound_id, f'Capture original sound-effect ID ${sound_id:02X} on driver voice {args.channel}')
            trace = []
            for frame in range(args.frames):
                p.run(1)
                if frame < 12 or frame % 30 == 29 or frame == args.frames - 1:
                    trace.append({'captureFrame': frame + 1, **audio_state(p)})
            path = args.output / f'sfx-{sound_id:02x}.wav'
            p.wav(path)
            entry = {'id': sound_id, 'command': hex(args.channel << 8 | sound_id), 'wav': path.name,
                     'wavSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                     'pcm': pcm_stats(p.audio), 'lastHalfSecond': pcm_stats(p.audio[-16020*4:]),
                     'instrumentDependencyAnalysis': {'sampleIds': instruments, 'status': parse_status, 'steps': steps,
                                                      'missingOrStaleSampleIds': [i for i in instruments if not availability.get(i, False)]},
                     'patches': p.patches, 'trace': trace}
            results.append(entry)
            # Persist progressively so interrupted catalogues retain provenance.
            report = {'romSha256': p.rom_sha, 'coreSha256': hashlib.sha256(Path(args.core).read_bytes()).hexdigest(),
                      'stateSha256': hashlib.sha256(Path(args.state).read_bytes()).hexdigest(),
                      'sourceState': str(Path(args.state).resolve()), 'fps': p.av.timing.fps,
                      'sampleRate': p.av.timing.sample_rate, 'sourceMusicId': p.u16(0x523),
                      'originalAudioState': original, 'quietAudioState': quiet,
                      'silencePreparationPatches': initial_patches, 'baselineLastSecond': baseline,
                      'baselinePeakTolerance': args.silence_tolerance,
                      'romMatchedLoadedSampleIds': [i for i, valid in availability.items() if valid],
                      'results': results,
                      'limitations': ['Sound bank is inherited from the selected game state; unloaded instruments can sound wrong.',
                                      'Music END setup is an explicit ARAM intervention, not ordinary play.',
                                      'CPU gameplay continues, so ambient/game effects may contaminate captures; inspect baseline and traces.',
                                      'Looping effects are truncated at --frames. Playback loudness is unchanged.',
                                      'Emulated Snes9x DSP output, not real SNES hardware.']}
            (args.output / 'capture.json').write_text(json.dumps(report, indent=2) + '\n')
            print(json.dumps({'id': sound_id, 'peak': entry['pcm']['peak'], 'rms': round(entry['pcm']['rms'], 2), 'tailRms': round(entry['lastHalfSecond']['rms'], 2)}), flush=True)
    finally:
        p.close()


if __name__ == '__main__':
    main()
