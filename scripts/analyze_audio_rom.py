"""Read-only structural audio analysis of the supplied DKC USA Rev 2 ROM.

No ROM/audio assets are copied into the application. Source names are navigation
hints from the public USA 1.0 disassembly; every offset/length below is decoded
from the supplied Rev 2 bytes and accompanied by a digest.
"""
import argparse
import hashlib
import json
import struct
import zipfile
from pathlib import Path

SHA = '628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527'
NAMES = ['DKIslandSwing', 'CaveDwellerConcert', 'MistyMenace', 'AquaticAmbience',
         'MineCartMadness', 'NorthernHemispheres', 'VoicesOfTheTemple', 'FearFactory',
         'LifeInTheMines', 'TitleTheme', 'SplashScreenFanfare', 'IceCaveChant',
         'SimianSegue', 'ForestFrenzy', 'CreditsConcerto', 'GameOver', 'BonusRoomBlitz',
         'DeathMusic', 'Victory', 'TreetopRock', 'FunkysFugue', 'BadBossBoogie',
         'CandysLoveSong', 'CrankysTheme', 'GangplankGalleon', 'Failure', 'BeatLevel']

def digest(data):
    return hashlib.sha256(data).hexdigest()

def address(offset):
    return f'${0xC00000 + offset:06X}'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('rom', nargs='?', default='/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip')
    parser.add_argument('--out', type=Path, default=Path(__file__).resolve().parents[1] / 'reference' / 'audio-rom-analysis.json')
    args = parser.parse_args()
    path = Path(args.rom)
    if path.suffix.lower() == '.zip':
        with zipfile.ZipFile(path) as archive:
            names = [n for n in archive.namelist() if n.lower().endswith(('.sfc', '.smc'))]
            if len(names) != 1:
                raise ValueError('Expected exactly one ROM member')
            rom = archive.read(names[0])
    else:
        rom = path.read_bytes()
    if len(rom) % 0x8000 == 512:
        rom = rom[512:]
    if digest(rom) != SHA:
        raise ValueError('Analysis is specifically verified for the supplied USA Rev 2 SHA256')

    def find(pattern):
        data = bytes.fromhex(pattern)
        matches = []
        offset = rom.find(data)
        while offset >= 0:
            matches.append(offset)
            offset = rom.find(data, offset + 1)
        if len(matches) != 1:
            raise ValueError(f'Expected unique signature, found {matches}: {pattern}')
        return matches[0]

    def span(offset, size):
        data = rom[offset:offset + size]
        if len(data) != size:
            raise ValueError('Out-of-range span')
        return {'fileOffset': f'0x{offset:06X}', 'hiromAddress': address(offset),
                'sizeBytes': size, 'sha256': digest(data), 'firstBytes': data[:24].hex(' ')}

    # Rev 2 adds stable-read polling and relocates the handshake byte to ARAM $04DE.
    bootstrap = find('cd 00 e4 f4 64 f4 d0 fa 65 de 04 f0 f5 c5 de 04 28 01 f0 0f e4 f5 64 f5 d0 fa c7 f6 e5 de 04 c4 f4 2f df 1f f6 00')
    entry = find('20 cd ff bd e4 f4 c5 de 04 c4 f4 3f 76 10 8f 00 24 8f 00 ed')
    boot_upload = find('08 c2 20 e2 10 a9 aa bb cd 40 21 d0 fb a9 b8 04 8d 42 21 a9 cc 01 8d 40 21 aa')
    assert bytes.fromhex('e8 e0 28 d0 eb') in rom[boot_upload:boot_upload + 72]
    driver_upload = find('08 e2 20 c2 10 a2 6e a3 86 4c a9 8a 85 4e a2 7b 0d 86 4f a9 e8 eb a9 04')
    # LDX $A36E is source minus 4; uploader adds 4. Destination $04E8, length $0D7B.
    driver_start = 0xAA372
    driver_size = struct.unpack_from('<H', rom, driver_upload + 15)[0]
    assert entry == driver_start + 0x100
    assert driver_start + driver_size == boot_upload

    brr_table = find('00 00 c7 39 0e c7 6d 24 c7 08 28 c7 d8 29 c7 a5 2e c7')
    samples = []
    for sample_id in range(70):
        pointer = int.from_bytes(rom[brr_table + sample_id * 3:brr_table + sample_id * 3 + 3], 'little')
        offset = pointer & 0x3FFFFF
        loop, length = struct.unpack_from('<HH', rom, offset)
        data = rom[offset + 4:offset + 4 + length]
        blocks = length // 9
        headers = data[:blocks * 9:9]
        if not blocks or length % 9 not in (0, 1) or any(h & 1 for h in headers[:-1]) or not (headers[-1] & 1):
            raise ValueError(f'Unexpected BRR framing in sample {sample_id:02X}')
        if loop % 9 or loop >= blocks * 9:
            raise ValueError(f'Unexpected loop offset in sample {sample_id:02X}')
        samples.append({'id': f'{sample_id:02X}', 'header': span(offset, 4),
                        'headerBytes': rom[offset:offset + 4].hex(' '), 'loopOffsetBytes': loop,
                        'uploadedBytes': length, 'brrBlocks': blocks, 'decodedFramesBeforeLoop': blocks * 16,
                        'endHeader': f'0x{headers[-1]:02X}', 'loopEnabled': bool(headers[-1] & 2),
                        'extraUploadedBytes': length % 9,
                        'extraUploadedByte': f'0x{data[-1]:02X}' if length % 9 else None,
                        'payload': span(offset + 4, length)})

    music_table = find('61 93 8a 00 00 c9 38 08 c9 00 80 8a bf 3b c9 f8 1c c9')
    music = []
    for track_id, name in enumerate(NAMES):
        pointer = int.from_bytes(rom[music_table + track_id * 3:music_table + track_id * 3 + 3], 'little')
        offset = pointer & 0x3FFFFF
        length, destination = struct.unpack_from('<HH', rom, offset)
        assert destination == 0x12A0 and destination + length < 0x3200
        music.append({'id': track_id, 'nameFromNavigationSource': name,
                      'cpuPointerBytes': rom[music_table + track_id * 3:music_table + track_id * 3 + 3].hex(' '),
                      'header': span(offset, 4), 'headerBytes': rom[offset:offset + 4].hex(' '),
                      'aramDestination': f'0x{destination:04X}', 'payloadBytes': length,
                      'channelPointers': [f'0x{x:04X}' for x in struct.unpack_from('<8H', rom, offset + 4)],
                      'payload': span(offset + 4, length)})

    global_sfx_offset = 0x92D95
    sfx_size, sfx_destination = struct.unpack_from('<HH', rom, global_sfx_offset)
    music_test = find('ad 6b 05 89 08 00 f0 38 ad 04 05 89 00 20 f0 30 20 04 c9 a5 7a 22 49 90 b9 a5 7a 1a c9 1b 00')
    music_state = find('8d 23 05 22 cb b1 8a a9 01 00 8d 1d 05 e2 20 a2 fe 00 22 af b1 8a')

    def sample_list(offset):
        ids = []
        while len(ids) <= 70:
            value = struct.unpack_from('<H', rom, offset + 2 * len(ids))[0]
            if value == 0xFFFF:
                return ids
            if value >= 70:
                raise ValueError('Invalid sample ID in instrument load list')
            ids.append(value)
        raise ValueError('Unterminated sample list')
    global_list_offset = find('01 00 02 00 03 00 06 00 07 00 08 00 09 00 0a 00 0b 00 0e 00 0f 00 1f 00')
    instrument_table = global_list_offset - 56
    instrument_sets = []
    for i in range(28):
        offset = 0xA0000 + struct.unpack_from('<H', rom, instrument_table + 2 * i)[0]
        ids = sample_list(offset)
        instrument_sets.append({'index': i, 'fileOffset': f'0x{offset:06X}', 'sampleIds': [f'{x:02X}' for x in ids],
                                'raw': rom[offset:offset + 2 * (len(ids) + 1)].hex(' ')})
    report = {
        'romSha256': digest(rom), 'romBytes': len(rom), 'revision': rom[0xFFDB],
        'sourceArchiveSha256': digest(path.read_bytes()),
        'method': 'Unique signature relocation, CPU/SPC instruction decoding, 24-bit table parsing and BRR header validation against supplied Rev 2 bytes; no emulation.',
        'navigationSource': 'https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly',
        'bootstrap': {'data': span(bootstrap, 0x28), 'aramDestination': '0x04B8',
                      'handshakeByte': '0x04DE', 'stableReadPort0': True, 'stableReadPort1': True,
                      'cpuUploader': span(boot_upload, driver_upload - boot_upload)},
        'driver': {'data': span(driver_start, driver_size), 'aramDestination': '0x04E8',
                   'aramEntry': '0x05E8', 'entryRom': f'0x{entry:06X}',
                   'cpuUploadSetup': span(driver_upload, 44),
                   'revisionDifference': 'USA 1.0 source uses $04E0/$05E0, handshake $04D6 and $0D7E bytes; supplied Rev 2 uses $04E8/$05E8, $04DE and $0D7B bytes.'},
        'brr': {'pointerTable': span(brr_table, 70 * 3), 'samples': samples,
                'framing': 'LE16 loop byte offset; LE16 upload size; 9-byte BRR blocks, each 16 samples. All 70 streams end with BRR END, preceding blocks do not. 68 uploads contain one byte beyond complete blocks; samples $10 and $1A do not.',
                'totalUploadedBytes': sum(s['uploadedBytes'] for s in samples)},
        'music': {'pointerTable': span(music_table, 27 * 3), 'tracks': music,
                  'framing': 'LE16 payload size then LE16 ARAM upload destination; 27 actual runtime table entries, all destination $12A0. Names are source-assisted annotations, not strings contained in ROM.'},
        'globalSoundEffects': {'container': span(global_sfx_offset, sfx_size + 4),
                               'payloadBytes': sfx_size, 'aramDestination': f'0x{sfx_destination:04X}'},
        'instrumentLoadLists': {'globalList': {'data': span(global_list_offset, 2 * (len(sample_list(global_list_offset)) + 1)),
                                              'sampleIds': [f'{x:02X}' for x in sample_list(global_list_offset)]},
                                'setPointerTable': span(instrument_table, 56), 'sets': instrument_sets,
                                'mappingLimit': '28 instrument sets exist for 27 runtime music IDs. Their caller-dependent mapping is not established here.'},
        'runtimeMusicSelection': {'musicTestMenuCode': span(music_test, 38), 'stateWriterCode': span(music_state, 23),
                                  'currentMusicIdWram': '0x0523', 'activeFlagWram': '0x051D',
                                  'musicTestFlagWram': '0x056B', 'musicTestFlagMask': '0x0008',
                                  'menuNextMusicIdDirectPage': '0x007A', 'menuSelectPressedWram': '0x0504',
                                  'menuSelectPressedMask': '0x2000',
                                  'usage': 'At file select, set music-test flag bit, choose DP $7A ID 0..26, then press Select. Static code establishes this path; runtime frontend must verify menu state and results.'},
        'limitations': ['Static data and local uploader behavior only; no SNES/SPC execution observed.',
                        'No music playback, mixing, ADSR, echo, resampling, instrument pitch or timing equivalence established.',
                        'The public source is USA 1.0 and was not assumed byte-identical; driver differences were verified directly.',
                        'Music sequence instruction sets and SFX event-to-ID mappings remain to decode.',
                        '68 of 70 samples upload one byte beyond complete BRR blocks; its musical purpose is not established.']}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'output': str(args.out), 'romSha256': report['romSha256'], 'driverBytes': driver_size,
                      'samples': len(samples), 'musicTracks': len(music),
                      'brrUploadedBytes': report['brr']['totalUploadedBytes']}, indent=2))

if __name__ == '__main__':
    main()
