"""Package verified Snes9x captures for mobile browser playback.

Music: AAC 96 kbps / 32 kHz in seekable M4A, lossy and resampled explicitly.
SFX: original stereo PCM16, only exact-zero trailing frames removed, retaining
40 ms guard. Never normalize, filter, invent loops or substitute synthesis.
"""
import argparse
import array
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import wave
import zipfile

EXPECTED = '628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527'
FX_NAMES = '''None TireBounce SteelKeg DiddySeeingStars ShootOutOfBarrelCannon DiddyBitesFinger KlaptrapBite LostLife StompEnemy Unknown09 RevealSecret1 RevealSecret2 BoomboxLands RambiLand QueenBBuzz ZingerDead RambiPant OpenBox Unknown12 DKHowl BreakBarrel KRoolLand Scratch MovingMinecart ClamboSpitPearl CroctopusBeginSpin TNTFuse Unknown1B Unknown1C KillSlippa CannonballLand Unknown1F Unknown20 CollectBanana CollectBananaBunch KrashMinecart Unknown24 Unknown25 EnterBarrelCannon RambiWalk1 RambiWalk2 Unknown29 Unknown2A Unknown2B FuelPlatformTick Unpause HitWithBlownKiss GainLife Unknown30 CollectFuelCan Unknown32 DiddyLand RambiHitEnemy Unknown35 Unknown36 Unknown37 Unknown38 Unknown39 Unknown3A Unknown3B Thunder1 Thunder2 DiddyMonkeySound DKMonkeySound DKTooCloseToEdge DiddyTooCloseToEdge KillKlaptrap DiddyHurt DKGulp DiddyGulp DKHurt KillArmy KillKlump KillKritter CrankyWhistle Unknown4B Unknown4C CrankyFalls ClamboClose CollectK CollectO CollectN CollectG KillKrusha KRoolRun Unknown55 RambiStab EnguardeStab GetOnAnimalBuddy WingFlap Unknown5A OilFireRise MankyKongThrow DiddyTrappedInBarrel DKTrappedInBarrel AnimalBuddyJump Collect1stAnimalBuddyToken Collect2ndAnimalBuddyToken Collect3rdAnimalBuddyToken Laugh DKLand SwitchKongs KillMiniNecky KillNecky Unknown68 Unknown69 UnusedBubbleSound UFOLikeNoise UnusedMenuChoice Unknown6D ZingerBuzz Unknown6F CreditsCroctopus UnusedFanfare1 UnusedFanfare2 CollectLifeBalloon Unknown74 DKSwim DiddySwim'''.split()


def sha(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''): value.update(block)
    return value.hexdigest()


def trim_fx(source, destination):
    with wave.open(str(source), 'rb') as wav:
        channels, width, rate, frames = wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getnframes()
        if channels != 2 or width != 2 or wav.getcomptype() != 'NONE': raise ValueError('Expected stereo PCM16 WAV')
        pcm = wav.readframes(frames)
    samples = array.array('h', pcm)
    last = len(samples) - 1
    while last >= 0 and samples[last] == 0: last -= 1
    last_nonzero_frame = last // channels + 1 if last >= 0 else 0
    guard = math.ceil(rate * .04)
    retained = min(frames, max(guard, last_nonzero_frame + guard))
    with wave.open(str(destination), 'wb') as wav:
        wav.setnchannels(channels); wav.setsampwidth(width); wav.setframerate(rate)
        wav.writeframes(pcm[:retained * channels * width])
    return {'seconds': retained / rate, 'sampleRate': rate, 'frames': retained,
            'sourceFrames': frames, 'trailingZeroFramesRemoved': frames - retained,
            'retainedTrailingGuardFrames': retained - last_nonzero_frame}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--captures-root', required=True, type=Path, help='runtime-rom directory containing music/music-rest/sfx/sfx-water')
    parser.add_argument('--rom', default='/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip', type=Path)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'public/audio')
    parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg') or '/opt/homebrew/bin/ffmpeg')
    parser.add_argument('--workers', default=4, type=int)
    args = parser.parse_args()
    if len(FX_NAMES) != 119: raise AssertionError('Name table must contain exactly 119 entries')
    if args.rom.suffix.lower() == '.zip':
        with zipfile.ZipFile(args.rom) as archive:
            names = [n for n in archive.namelist() if n.lower().endswith(('.sfc', '.smc'))]
            if len(names) != 1: raise ValueError('Expected one ROM')
            rom = archive.read(names[0])
    else: rom = args.rom.read_bytes()
    if len(rom) % 0x8000 == 512: rom = rom[512:]
    if hashlib.sha256(rom).hexdigest() != EXPECTED: raise ValueError('ROM identity mismatch')
    del rom
    captures = {}
    for kind in ('music', 'music-rest', 'sfx', 'sfx-water'):
        file = args.captures_root / kind / 'capture.json'
        data = json.loads(file.read_text())
        if data['romSha256'] != EXPECTED: raise ValueError(f'Capture ROM mismatch: {kind}')
        captures[kind] = data
    tracks = {}
    for kind in ('music', 'music-rest'):
        for item in captures[kind]['tracks']:
            if item['id'] in tracks: raise ValueError('Duplicate music ID')
            if item['observedMusicId'] != item['id']: raise ValueError('Runtime music ID mismatch')
            source = args.captures_root / kind / item['file']
            if sha(source) != item['wavSha256']: raise ValueError(f'Music WAV hash mismatch: {source}')
            tracks[item['id']] = (kind, item, source)
    if set(tracks) != set(range(27)): raise ValueError('Expected all 27 music captures')
    effects = {item['id']: ('sfx', item) for item in captures['sfx']['results']}
    water_replacements = {item['id']: ('sfx-water', item) for item in captures['sfx-water']['results']}
    if set(water_replacements) != {0x6A, 0x75, 0x76}: raise ValueError('Expected the three instrument-correct aquatic replacements')
    effects.update(water_replacements)
    if set(effects) != set(range(119)): raise ValueError('Expected all 119 sound-effect captures')
    for sound_id, (kind, item) in effects.items():
        deps = item['instrumentDependencyAnalysis']
        if deps['missingOrStaleSampleIds'] or deps['status'] not in ('END', 'repeated control state'):
            raise ValueError(f'Unverified instruments/control flow for SFX {sound_id:02X}')
        source = args.captures_root / kind / item['wav']
        if sha(source) != item['wavSha256']: raise ValueError(f'SFX WAV hash mismatch: {source}')
    args.output.mkdir(parents=True, exist_ok=True)
    music_manifest = {}

    def encode_music(pair):
        track_id, (kind, item, source) = pair
        name = f'music-{track_id:02d}.m4a'; target = args.output / name
        temporary = args.output / f'.music-{track_id:02d}.tmp.m4a'
        subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
                        '-i', str(source), '-map_metadata', '-1', '-vn', '-ar', '32000', '-ac', '2',
                        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(temporary)], check=True)
        temporary.replace(target)
        loop = item['loop']
        if loop and not (0 <= loop['startSeconds'] < loop['endSeconds'] <= item['seconds']): raise ValueError('Invalid loop bounds')
        entry = {'url': '/audio/' + name, 'name': item['name'], 'id': track_id, 'sourceId': track_id,
                 'loop': ({'startSeconds': loop['startSeconds'], 'endSeconds': loop['endSeconds'],
                           'samplePerfect': False, 'method': loop['method']} if loop else None),
                 'seconds': item['seconds'], 'sha256': sha(target), 'bytes': target.stat().st_size,
                 'sourceWavSha256': item['wavSha256'], 'sourceCapture': kind,
                 'encoding': 'AAC 96 kbps, stereo, resampled from 32040 to 32000 Hz; lossy',
                 'observedMusicId': item['observedMusicId']}
        print(json.dumps({'music': track_id, 'bytes': entry['bytes']}), flush=True)
        return str(track_id), entry

    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as pool:
        for key, value in pool.map(encode_music, sorted(tracks.items())): music_manifest[key] = value
    effect_manifest = {}
    for sound_id, (kind, item) in sorted(effects.items()):
        filename = f'sfx-{sound_id:02x}.wav'; target = args.output / filename
        stats = trim_fx(args.captures_root / kind / item['wav'], target)
        effect_manifest[str(sound_id)] = {'url': '/audio/' + filename, 'name': FX_NAMES[sound_id],
                                         'id': sound_id, 'sourceId': sound_id, **stats,
                                         'sha256': sha(target), 'bytes': target.stat().st_size,
                                         'sourceWavSha256': item['wavSha256'], 'sourceCapture': kind,
                                         'instrumentSampleIds': item['instrumentDependencyAnalysis']['sampleIds'],
                                         'sequenceStatus': item['instrumentDependencyAnalysis']['status'],
                                         'pcmModifiedOnlyByTrailingZeroTrim': True,
                                         'baselinePeak': captures[kind]['baselineLastSecond']['peak']}
    provenance = {
        'romSha256': EXPECTED,
        'source': 'User-supplied USA Rev 2 ROM, executed with official libretro/Snes9x and local analysis bridge',
        'coreSha256s': sorted({data['coreSha256'] for data in captures.values()}),
        'sourceCaptureReportSha256s': {kind: sha(args.captures_root / kind / 'capture.json') for kind in captures},
        'sampleRateSource': 32040, 'musicEncoding': 'AAC 96 kbps stereo at 32000 Hz, lossy; streamed M4A',
        'effectsEncoding': 'Original stereo PCM16 WAV, exact-zero trailing frames only trimmed with 40 ms guard',
        'musicCount': 27, 'effectCount': 119,
        'instrumentValidation': 'Each included SFX dependency matched complete ROM BRR bytes through actual ARAM DSP-directory mappings; water samples replace stale jungle-bank captures.',
        'musicLoopPrecision': 'Repeated sequencer-state candidates at emulator frame boundaries, not sample-perfect PCM seams',
        'captureInterventions': 'Built-in music-test flag and ID; SFX captures pause gameplay and redirect existing streams to authentic END opcode before real APU port commands.',
        'aquaticBaseline': 'The three water SFX retain an observed residual PCM peak of 4/32768; no filter or normalization applied.',
        'limits': ['Emulated audio, not physical SNES analog output.', 'AAC is lossy and resampled; it is not bit-identical PCM.',
                   'Loop candidates are unverified at sample precision; null does not prove a track has no loop.',
                   'Four-second SFX captures can truncate long or repeating sounds; names marked Unknown/Unused are not automatically appropriate gameplay events.',
                   'Sound names are annotations from the public USA 1.0 navigation source; all capture bytes derive from the verified Rev 2.']}
    manifest = {'music': music_manifest, 'effects': effect_manifest, 'provenance': provenance}
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    reference = Path(__file__).resolve().parents[1] / 'reference' / 'audio-runtime-capture.json'
    reference.parent.mkdir(parents=True, exist_ok=True)
    report = {'manifest': manifest, 'captures': captures,
              'sourcePaths': {kind: str((args.captures_root / kind / 'capture.json').resolve()) for kind in captures}}
    reference.write_text(json.dumps(report, indent=2) + '\n')
    total_bytes = sum(file.stat().st_size for file in args.output.iterdir() if file.is_file())
    print(json.dumps({'output': str(args.output), 'music': len(music_manifest), 'effects': len(effect_manifest),
                      'totalBytes': total_bytes, 'manifestSha256': sha(args.output / 'manifest.json')}), flush=True)


if __name__ == '__main__':
    main()
