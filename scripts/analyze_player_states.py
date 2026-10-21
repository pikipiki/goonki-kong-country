"""Focused read-only Rev 2 evidence for normal player jumps and barrel states."""
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
            raise ValueError('Expected exactly one ROM')
        rom = archive.read(names[0])
else:
    rom = path.read_bytes()
if len(rom) % 0x8000 == 512:
    rom = rom[512:]
if len(rom) != 0x400000 or hashlib.sha256(rom).hexdigest() != '628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527':
    raise ValueError('Expected the supplied USA Rev 2 ROM')

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
    'pinkNormalJump': (
        'a9 00 07 9d f1 0e bd 71 12 30 09 ad 79 05 09 00 10 8d 79 05 6b',
        'LDA #$0700; STA $0EF1,X; inspect sprite flags; conditionally set global $0579 bit $1000; RTL.',
        {'verticalSpeedRaw': 1792, 'pixelsPerTick': 7, 'worldUnitsPerSecondAt32px60Hz': 13.125},
        'Normal DK jump script calls $BEA7DA from 0x3EA6B4 after preparation poses. Pink is the adaptation mapping of DK.'),
    'violetNormalJump': (
        'a9 5a 08 9d f1 0e bd 71 12 30 09 ad 79 05 09 00 10 8d 79 05 6b',
        'LDA #$085A; STA $0EF1,X; inspect sprite flags; conditionally set global $0579 bit $1000; RTL.',
        {'verticalSpeedRaw': 2138, 'pixelsPerTick': 2138 / 256, 'worldUnitsPerSecondAt32px60Hz': 2138 / 256 * 60 / 32},
        'Normal Diddy jump script calls $BEA7C5 from 0x3EB1CA after preparation poses. Violet is the adaptation mapping of Diddy.'),
    'cannonAngleQuantization': (
        'bd 91 14 18 69 aa 0a 29 00 f0 eb 85 78',
        'LDA $1491,X; CLC; ADC #$0AAA; AND #$F000; XBA; STA $78.',
        {'angleBiasRaw': 2730, 'angleMaskRaw': 61440, 'angleBins': 16},
        'Used before cannon launch direction lookup. Bias and mask are exact; this is not a universal constant launch speed.'),
    'pinkJumpPreparation': (
        '81 3a b2 be 02 30 01 81 da a7 be',
        'Animation op81 calls $BEB23A; pose $0130 lasts 2 animation units; op81 calls the verified $BEA7DA impulse.',
        {'preparationAnimationUnits': 2, 'preparationPoseCount': 1},
        'Nominal two animation updates at speed $0100, not a runtime-measured input-to-impulse latency. Request parsing and same-frame update order may affect the first tick.'),
    'violetJumpPreparation': (
        '81 3a b2 be 01 24 0a 01 2c 0a 81 c5 a7 be',
        'Animation op81 calls $BEB23A; poses $0A24 and $0A2C each last 1 animation unit; op81 calls $BEA7C5 impulse.',
        {'preparationAnimationUnits': 2, 'preparationPoseCount': 2},
        'Nominal two animation updates at speed $0100. Total input latency still depends on caller/update ordering.'),
    'controllerHeldPressedMapping': (
        'a5 44 0a a8 b9 04 05 85 80 b9 00 05 85 7e',
        'Controller-indexed pressed button RAM $0504,Y is copied to $80; held button RAM $0500,Y to $7E.',
        {'heldScratch': '$7E', 'pressedScratch': '$80'},
        'Held/pressed RAM labels are cross-checked with the navigation source; this signature establishes the dispatch input mapping.'),
    'carryHoldReleaseDispatch': (
        'a5 7e 29 00 40 f0 05 20 94 bc 80 03 20 4f bc',
        'Test held Y mask $4000; if present call $BC94 (pickup/roll dispatch), otherwise call $BC4F (release held object).',
        {'heldButtonMask': 16384, 'heldHandler': '$BFBC94', 'releaseHandler': '$BFBC4F'},
        'This is hold-to-carry and release-to-throw in the original controller path. A click-toggle adaptation must be documented separately.'),
    'carryReleaseThrowOrPlace': (
        'a4 84 b9 f5 16 d0 01 60 b9 ad 16 c9 4a 00 f0 f7 c9 4b 00 f0 f2 a6 82 bd 31 16 d0 07 a5 7e 29 00 04 d0 0d a6 82 9e 25 0f a9 4a 00 22 a4 80 be 60 b9 ad 16 c9 47 00 f0 cf a6 82 9e 25 0f a9 4b 00 22 a4 80 be',
        'Return if no held object or already throwing/placing; if ground-distance zero and Down held, request place animation $004B; otherwise stop target horizontal movement and request throw animation $004A.',
        {'throwAnimation': 74, 'placeAnimation': 75, 'downMask': 1024},
        'Ground-distance/state semantics are source-guided. Pickup animation $0047 suppresses early placement; every object-specific path is not traced.'),
    'thrownObjectVelocity': (
        'a9 00 10 3c 69 0c 50 04 49 ff ff 1a 9d 89 0e a9 80 03 3c 69 0c 50 04 49 ff ff 1a 9d 25 0f a9 00 ff 9d f1 0e 9e a5 12',
        'Set object current X velocity to signed $1000 and target X velocity to signed $0380 using flip flag; Y velocity $FF00; clear contact flags.',
        {'horizontalInitialMagnitudeRaw': 4096, 'horizontalTargetMagnitudeRaw': 896, 'verticalRaw': -256},
        'Shared DK/Diddy throw animation callback. Raw initial 16 px/tick differs from target 3.5; acceleration, collisions and object state govern actual travel. Rev2 subsequently calls terrain reposition helper $B6FCFA.'),
    'pinkThrowPreparation': (
        '81 8a 8e be 81 98 8e be 8b 02 e4 02 02 00 2e 00',
        'Throw script first enters carry-animation state, marks held object, then begins timed op8B pose/held-object offsets.',
        {'throwPreparationAnimationUnits': 22, 'poseCountBeforeRelease': 11},
        'The 22 units are independently decoded by the animation parser below, not established from this prefix alone. Request-to-release time requires simulation update ordering.'),
    'animationDefaultSpeed': (
        'a9 00 01 9d 39 11 9e 05 11 9e 0d 13',
        'Initialize animation speed $0100, zero pose timer $1105 and callback state $130D.',
        {'speedRaw': 256},
        'Default animation setup. Specific states may subsequently override animation speed.'),
    'animationTimerStep': (
        'a6 82 bd 05 11 38 fd 39 11 9d 05 11 f0 02 10 3d',
        'Subtract animation speed from pose timer each update; zero/negative advances parsing.',
        {'timerAddress': '$1105,X', 'speedAddress': '$1139,X'},
        'Verifies duration interpretation at default speed, without asserting exact main-loop input latency.'),
    'jumpReleaseClearsHeldGravity': (
        'a6 84 bd 99 16 29 fc ff 9d 99 16 60',
        'Clear $1699,X bits 0 and 1 when the held-B controller branch is not taken.',
        {'clearMask': 65532},
        'Combined with the air-gravity selector from buddy-analysis this explains release changing from the held parameter to normal gravity.'),
    'cannonBaseTemplate': (
        '45 0d 38 00 8d 0b ec 00 a1 11 00 00 29 10 00 00 61 15 00 00 c1 0f 10 10 f5 0f 28 00',
        'Spawn script pairs set sprite ID $0038, draw depth $00EC, zero states, packed player-flight timers $0FC1=$1010 and launch multiplier $0FF5=$0028.',
        {'launchMultiplier': 40, 'flightTimerPacked': 4112, 'gravityDelayCounter': 16, 'controlDelayCounter': 16, 'derivedCardinalSpeedRaw': 2550},
        'Base template, not every placed cannon. Other spawn scripts and instance parameters may override these values.'),
    'cannonLaunchMultiply': (
        '10 16 49 ff ff 1a 05 76 8d 02 42 ad 16 42 ad 16 42 4a 4a 49 ff ff 1a 60 05 76 8d 02 42 ad 16 42 ad 16 42 4a 4a 60',
        'Take sign of trig component, multiply absolute low byte by packed multiplier through $4202/$4203, read $4216 product, shift right twice, restore sign.',
        {'productRightShift': 2, 'trigCardinalMagnitude': 255},
        'SNES hardware multiplier semantics are part of the interpretation; the routine includes read delays before product use.'),
    'cannonTrigLookup': (
        '29 ff 00 0a aa bf 20 bd bc 60 18 69 40 00 29 ff 00 0a aa bf 20 bd bc 60',
        'First direction lookup uses (angle & 255)*2 into $BCBD20; second offsets angle by $40 for its perpendicular component.',
        {'tableHiromAddress': '$BCBD20', 'quarterTurnIndex': 64},
        'Actual signed table entries are read below only to emit the 16 launch direction samples, not to export ROM assets.'),
    'cannonAssignFlightTimers': (
        'bd c1 0f eb 29 ff 00 99 75 13 bd c1 0f 29 ff 00 99 e9 13',
        'Copy packed $0FC1 high byte to player $1375 (gravity delay) and low byte to $13E9 (control delay).',
        {'gravityCounterAddress': '$1375,Y', 'controlCounterAddress': '$13E9,Y'},
        'The caller sets cannon-flight player state $0028; exact frame count depends on whether the player handler already ran in the current frame.'),
    'cannonFlightCounterGate': (
        'bd e9 13 30 05 de e9 13 80 06 a9 0e 00 20 c5 b2 a6 82 bd 75 13 30 11 de 75 13 a5 28 4a 90 07 a0 e3 86 22 1c 80 b5 80 21',
        'If control counter is nonnegative decrement it; otherwise dispatch input mode $000E. If gravity counter is nonnegative decrement it, emit periodic effect and branch past gravity/velocity adjustment.',
        {'inclusiveCounterTest': True},
        'A starting value of 16 is nonnegative for 17 handler visits. This describes the gate; wall-time and collision interruptions remain unmeasured.'),
}
findings = {}
for name, (pattern, decoding, values, limitation) in specs.items():
    findings[name] = {'verified': True, 'matches': locate(pattern), 'manual65C816Decoding': decoding, 'values': values, 'limitation': limitation}
findings['pinkNormalJump']['animationCalls'] = locate('81 da a7 be')
findings['violetNormalJump']['animationCalls'] = locate('81 c5 a7 be')
findings['thrownObjectVelocity']['animationCalls'] = locate('81 a7 8e be')

def animation_preparation(start, target):
    """Decode only the finite straight-line preparation section, never execute ROM."""
    pos, elapsed, poses, trace = start, 0, 0, []
    for _ in range(64):
        opcode = rom[pos]
        entry = {'fileOffset': f'0x{pos:06X}', 'animationUnitsBefore': elapsed}
        if opcode == 0x81:
            address = int.from_bytes(rom[pos + 1:pos + 4], 'little')
            entry.update({'operation': 'callback', 'address': f'${address:06X}'})
            trace.append(entry)
            if address == target:
                return {'startOffset': f'0x{start:06X}', 'callback': f'${target:06X}', 'durationAnimationUnits': elapsed, 'preparationPoses': poses, 'trace': trace}
            pos += 4
        elif opcode in (0x8E, 0x8F, 0x90):
            entry.update({'operation': 'sound', 'soundId': rom[pos + 1]})
            trace.append(entry)
            pos += 2
        elif opcode == 0x8B:
            duration = rom[pos + 1]
            entry.update({'operation': 'heldObjectPose', 'duration': duration, 'pose': int.from_bytes(rom[pos + 2:pos + 4], 'little'), 'heldOffsetX': int.from_bytes(rom[pos + 4:pos + 6], 'little', signed=True), 'heldOffsetY': int.from_bytes(rom[pos + 6:pos + 8], 'little', signed=True)})
            elapsed += duration
            poses += 1
            trace.append(entry)
            pos += 8
        elif opcode < 0x80:
            entry.update({'operation': 'pose', 'duration': opcode, 'pose': int.from_bytes(rom[pos + 1:pos + 3], 'little')})
            elapsed += opcode
            poses += 1
            trace.append(entry)
            pos += 3
        else:
            raise AssertionError(f'Unexpected animation opcode ${opcode:02X} at ${pos:06X}')
    raise AssertionError('Target callback not reached in bounded preparation scan')

def unique_offset(pattern):
    matches = locate(pattern)
    if len(matches) != 1:
        raise AssertionError('Expected a unique animation prefix')
    return int(matches[0]['fileOffset'], 16)

animation_timings = {
    'pinkJump': animation_preparation(unique_offset('81 3a b2 be 02 30 01 81 da a7 be'), 0xBEA7DA),
    'violetJump': animation_preparation(unique_offset('81 3a b2 be 01 24 0a 01 2c 0a 81 c5 a7 be'), 0xBEA7C5),
    'pinkThrow': animation_preparation(unique_offset('81 8a 8e be 81 98 8e be 8b 02 e4 02 02 00 2e 00'), 0xBE8EA7),
    'violetThrow': animation_preparation(unique_offset('81 8a 8e be 81 98 8e be 8b 02 ac 0c 08 00 0b 00'), 0xBE8EA7),
}
assert animation_timings['pinkJump']['durationAnimationUnits'] == 2
assert animation_timings['violetJump']['durationAnimationUnits'] == 2
assert animation_timings['pinkThrow']['durationAnimationUnits'] == 22
assert animation_timings['violetThrow']['durationAnimationUnits'] == 19

trig_offset = int(findings['cannonTrigLookup']['values']['tableHiromAddress'][1:], 16) - 0xC00000
trig_values = [int.from_bytes(rom[trig_offset + index * 2:trig_offset + index * 2 + 2], 'little', signed=True) for index in range(256)]
assert [trig_values[i] for i in (0, 64, 128, 192)] == [0, -255, 0, 255]
multiplier = findings['cannonBaseTemplate']['values']['launchMultiplier']
def signed_product(component):
    value = (abs(component) * multiplier) >> 2
    return -value if component < 0 else value
cannon_vectors = [
    {'quantizedAngleRaw': index << 8, 'velocityXRaw': signed_product(trig_values[index]), 'velocityYRaw': signed_product(trig_values[(index + 64) & 255])}
    for index in range(0, 256, 16)
]
report = {
    'romSha256': hashlib.sha256(rom).hexdigest(),
    'method': 'Exact signature relocation against supplied Rev 2 ROM and manual 65C816 decoding; USA 1.0 community source used solely for navigation and state names.',
    'navigationSource': 'https://github.com/Yoshifanatic1/Donkey-Kong-Country-1-Disassembly',
    'units': 'Velocity raw is 8.8 SNES pixels/tick. Conversion to world units assumes 32 pixels/unit and 60 ticks/second; these are adaptation conventions.',
    'findings': findings,
    'animationPreparations': animation_timings,
    'cannonBaseTemplateVectors': cannon_vectors,
    'limitations': ['No emulator execution or frame-perfect parity claim.', 'Animation preparation duration is decoded in animation units at default speed; actual input-to-action latency depends on update ordering and overrides.', 'A verified local constant does not establish every state/caller using it. Cannon vectors are derived for the base spawn template, not every level instance.', 'Exact projectile deceleration/collisions, pickup timing, all mounted/carrying interactions and every original level are not traced.'],
}
out = Path(__file__).resolve().parents[1] / 'reference' / 'player-states.json'
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({name: [m['fileOffset'] for m in finding['matches']] for name, finding in findings.items()}, indent=2))
