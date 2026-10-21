"""Read-only relocation of buddy/roll 65C816 signatures in the supplied Rev 2 ROM.

The USA 1.0 community disassembly is a navigation aid only. Every emitted
signature must occur in the actual supplied ROM. This is focused static
analysis, not an emulator trace or a complete reverse engineering.
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip')
if path.suffix.lower() == '.zip':
    with zipfile.ZipFile(path) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith(('.sfc', '.smc'))]
        if len(names) != 1:
            raise ValueError('Expected one ROM')
        rom = archive.read(names[0])
else:
    rom = path.read_bytes()
if len(rom) % 0x8000 == 512:
    rom = rom[512:]
if len(rom) != 0x400000 or rom[0xFFDB] != 2:
    raise ValueError('Expected the 4 MiB Rev 2 ROM')

def locate(pattern):
    data = bytes.fromhex(pattern)
    found, start = [], 0
    while True:
        offset = rom.find(data, start)
        if offset < 0:
            break
        found.append({'fileOffset': f'0x{offset:06X}', 'hiromAddress': f'${0xC00000 + offset:06X}', 'bytes': data.hex(' ')})
        start = offset + 1
    if not found:
        raise AssertionError(f'Unverified signature: {pattern}')
    return found

specs = {
    'buddyRunTargets': (
        'b9 12 05 f0 20 aa bd 45 0d c9 0a 00 f0 11 c9 0b 00 f0 06 a9 80 03 a6 82 60 a9 00 03 a6 82 60 a9 00 04 a6 82 60',
        'Load rider buddy slot $0512,Y; compare buddy sprite $0D45,X with Expresso $000A and Winky $000B; return $0380 by default, $0300 for Winky, $0400 for Expresso.',
        {'defaultIncludingRambiRaw': 896, 'winkyRaw': 768, 'expressoRaw': 1024},
        'Local target speed, before character/state modifiers; not a universal observed maximum.'),
    'buddyWalkTargets': (
        'b9 12 05 f0 20 aa bd 45 0d c9 0a 00 f0 11 c9 0b 00 f0 06 a9 00 02 a6 82 60 a9 00 02 a6 82 60 a9 00 03 a6 82 60',
        'Same buddy dispatch; return $0200 by default and for Winky, $0300 for Expresso.',
        {'defaultIncludingRambiRaw': 512, 'winkyRaw': 512, 'expressoRaw': 768},
        'The default branch includes other mounted types; source names alone do not establish all callers.'),
    'rollBaseSpeeds': (
        'a9 00 01 99 f1 16 a5 7e 29 00 03 f0 06 a9 00 03 99 f1 16',
        'LDA #$0100; STA $16F1,Y; LDA $7E; AND #$0300; BEQ +6; LDA #$0300; STA $16F1,Y.',
        {'stationaryRaw': 256, 'directionHeldRaw': 768},
        'Roll/cartwheel speed accumulator initialization; additional bonus and character scaling follow.'),
    'recentRunRollBonus': (
        'a5 28 99 a1 16 99 a9 16 38 f9 e1 16 c9 10 00 10 0e a9 00 04 99 f1 16 a9 40 00 19 99 16',
        'Store current counter $28; subtract timestamp $16E1,Y; if result below $0010, set roll speed $0400 and flag $0040.',
        {'elapsedThreshold': 16, 'bonusSpeedRaw': 1024},
        'Timestamp role is inferred from adjacent source updating it during running; signed comparison and clock wrap require runtime testing.'),
    'cartwheelSpeedScaling': (
        'a5 82 c9 02 00 f0 0e b9 f1 16 85 76 4a 4a 4a 18 65 76 99 f1 16',
        'Compare current sprite index $82 with $0002; other index adds accumulator>>3 to itself.',
        {'numerator': 9, 'denominator': 8, 'unscaledSpriteIndex': 2},
        'For nonnegative raw speed, multiplier is 1.125 with integer truncation; index-to-character labeling comes from navigation source.'),
    'rollChainAcceleration': (
        'b9 f1 16 18 69 00 01 c9 00 08 30 03 a9 00 08 99 f1 16',
        'LDA $16F1,Y; CLC; ADC #$0100; CMP #$0800; BMI +3; LDA #$0800; STA $16F1,Y.',
        {'incrementRaw': 256, 'capRaw': 2048},
        'The local routine is reached from roll chaining states; exact enemy-hit timing and duration are not traced.'),
    'rollingJumpGroundBypass': (
        'bd 29 10 c9 12 00 f0 19 c9 13 00 f0 14 c9 19 00 f0 0f bd 31 16 d0 6c bd 09 12 29 07 00 c5 f3 10 62',
        'States $0012/$0013/$0019 branch past ordinary ground/terrain checks to shared jump setup.',
        {'bypassStates': [18, 19, 25]},
        'Supports roll/cartwheel off-edge jump eligibility while roll state persists; it does not establish an arbitrary grace timer.'),
    'expressoFlutterEntry': (
        'a9 00 04 9d f1 0e bd c1 0b 18 69 18 00 9d c1 0b a9 43 00 22 92 80 be',
        'Set vertical speed $0400; add $0018 to Y position; request animation $0043 through $BE8092.',
        {'verticalSpeedRaw': 1024, 'poseRepositionPixels': 24, 'animation': 67},
        'Entry behavior only. This is not a fall-speed cap; the animation/physics continuation must be traced separately.'),
    'riderAirGravity': (
        'a9 15 00 9d 29 10 a4 84 a9 b8 ff 99 f9 16 a9 2e 00 22 92 80 be',
        'Set rider state $0015; store $FFB8 to $16F9,Y; request mounted jump animation $002E.',
        {'heldGravityRaw': -72, 'animation': 46},
        'Mounted land jump setup; the separate animation impulse signatures below establish initial velocity but not total jump height.'),
    'enguardeStabEntry': (
        'a4 84 b9 ad 16 c9 3d 00 f0 24 a9 3a 00 22 92 80 be a6 82 9e f1 0e a9 4c 00 9d 29 10',
        'Check current animation $003D; request mounted-family attack $003A via dispatcher; zero vertical speed; enter state $004C.',
        {'attackState': 76, 'enguardeAnimation': 61},
        'Mounted animation dispatch maps attack family to Enguarde. Separate animation signature below verifies impulse, not full duration.'),
    'rambiExpressoJumpImpulse': (
        'a9 00 07 9d f1 0e a9 5f 00 22 8f fb bf 6b',
        'LDA #$0700; STA $0EF1,X; request animal jump sound $005F; RTL. Two adjacent instances are called from mounted Rambi and Expresso animation scripts.',
        {'verticalSpeedRaw': 1792, 'pixelsPerTick': 7},
        'The impulse occurs after animation preparation, not necessarily on the input tick. Calls at 0x3EC139/0x3EC1B1 target $BEA7EF (Rambi); 0x3EC9E5/0x3ECACF target $BEA7FD (Expresso).'),
    'winkyJumpImpulse': (
        'a9 00 08 9d f1 0e a9 5f 00 22 8f fb bf 6b',
        'LDA #$0800; STA $0EF1,X; request animal jump sound $005F; RTL.',
        {'verticalSpeedRaw': 2048, 'pixelsPerTick': 8},
        'Called by Winky mounted animation after preparation poses; calls 0x3EC570/0x3EC698 target $BEA80B. Full jump height still depends on held input, gravity and contact.'),
    'enguardeStabImpulse': (
        'a9 4d 00 9d 29 10 a6 82 a9 00 04 3c 69 0c 50 04 49 ff ff 1a 9d 89 0e 9d 25 0f a9 57 00 22 8f fb bf',
        'Set state $004D; choose signed $0400 according to horizontal flip flag; store current and target horizontal speed; play Enguarde stab sound.',
        {'horizontalMagnitudeRaw': 1024, 'pixelsPerTick': 4, 'state': 77},
        'Animation call at 0x3EBBC4 targets $BEBC17. Attack duration and all interruption/collision paths still need runtime verification.'),
    'airGravitySelector': (
        'a6 82 a4 84 b9 99 16 29 02 00 f0 0a b9 f9 16 80 0d a9 90 ff 80 08 e0 04 00 f0 f6 a9 90 ff 18 7d f1 0e 10 08 c9 00 f8 b0 03 a9 00 f8 9d f1 0e 60',
        'If $1699,Y bit $0002 is set, use acceleration parameter $16F9,Y; otherwise use $FF90. Add to vertical velocity with negative cap $F800.',
        {'releasedGravityRaw': -112, 'terminalRaw': -2048, 'heldParameterAddress': '$16F9,Y'},
        'Combined with mounted jump setup this establishes -72 while that flag persists. Exact input release/state lifetime still requires execution traces.'),
}
findings = {}
for name, (pattern, decoding, values, limitation) in specs.items():
    findings[name] = {'verified': True, 'matches': locate(pattern), 'manual65C816Decoding': decoding, 'values': values, 'limitation': limitation}
for name, calls in {
    'rambiExpressoJumpImpulse': ['81 ef a7 be', '81 fd a7 be'],
    'winkyJumpImpulse': ['81 0b a8 be'],
    'enguardeStabImpulse': ['81 17 bc be'],
}.items():
    findings[name]['verifiedAnimationCalls'] = [match for pattern in calls for match in locate(pattern)]
report = {
    'romSha256': hashlib.sha256(rom).hexdigest(),
    'method': 'Exact byte relocation against user supplied Rev 2 followed by manual 65C816 decoding; USA 1.0 source used only for navigation and state names.',
    'navigationSource': 'https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly',
    'units': 'Speed raw is signed 8.8 SNES pixels per simulation tick, consistent with verified position integration; raw / 256 gives pixels/tick. World scale and seconds conversion are adaptation choices.',
    'findings': findings,
    'limitations': ['No SNES execution, complete decompilation, cycle-accurate timing or frame-perfect parity claim.', 'Exact mounted jump heights/timing, Expresso sustained flutter, Enguarde dash duration, mounted damage/recovery and every original level are not completely traced.', 'Some semantics use labeled USA 1.0 navigation source; verified bytes establish only the decoded local operations and branch conditions.'],
}
out = Path(__file__).resolve().parents[1] / 'reference' / 'buddy-analysis.json'
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({name: [m['fileOffset'] for m in item['matches']] for name, item in findings.items()}, indent=2))
