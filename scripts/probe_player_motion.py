"""Measure the supplied Rev 2 ROM through the existing headless SnesProbe frontend.

No RAM patching or teleportation. Every scenario starts from a hashed save state;
the Diddy state is obtained by the recorded controller sequence from Jungle DK.
Emulator states and screenshots stay in the requested work output directory.
"""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

from snes_probe import SnesProbe

DEFAULT_WORK = Path('/Users/sevenone./Documents/Codex/2026-10-21/cre/work')
DEFAULT_CORE = DEFAULT_WORK / 'snes9x/libretro/snes9x_libretro.dylib'
DEFAULT_GROUND = DEFAULT_WORK / 'runtime-rom/ground/ground.state'
RESCUE_SEQUENCE = [
    {'frames': 50, 'buttons': ['Right', 'Y']},
    {'frames': 38, 'buttons': ['Right', 'Y', 'B']},
    {'frames': 5, 'buttons': ['Right', 'Y']},
    {'frames': 40, 'buttons': ['Right', 'Y', 'B']},
    {'frames': 40, 'buttons': ['Right', 'Y']},
    {'frames': 100, 'buttons': []},
    {'frames': 1, 'buttons': ['Select']},
    {'frames': 100, 'buttons': []},
]

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def sample(probe, slot, buttons):
    kong_index = slot - 2
    return {
        'frame': probe.frame, 'buttons': buttons,
        'currentKong': probe.u16(0x056F), 'spriteSlotByteOffset': slot,
        'spriteId': probe.u16(0x0D45 + slot),
        'x': probe.u16(0x0B19 + slot), 'y': probe.u16(0x0BC1 + slot),
        'xFractionRaw': probe.u16(0x0DB9 + slot),
        'yFractionRaw': probe.u16(0x0E21 + slot),
        'vxRaw': probe.s16(0x0E89 + slot), 'vyRaw': probe.s16(0x0EF1 + slot),
        'targetVxRaw': probe.s16(0x0F25 + slot),
        'state': probe.u16(0x1029 + slot),
        'animationId': probe.u16(0x10D1 + slot),
        'animationSpeedRaw': probe.s16(0x1139 + slot),
        'animationTimerRaw': probe.s16(0x1105 + slot),
        'groundDistance': probe.s16(0x1631 + slot),
        'jumpFlags': probe.u16(0x1699 + kong_index),
        'heldGravityRaw': probe.s16(0x16F9 + kong_index),
        'carrySlot': probe.u16(0x16F5 + kong_index),
        'mountSlot': probe.u16(0x0512 + kong_index),
    }

def precise_y(row):
    return row['y'] + row['yFractionRaw'] / 65536

def jump_metrics(initial, rows):
    impulse_index = next((i for i, row in enumerate(rows) if row['vyRaw'] > 0), None)
    if impulse_index is None:
        raise AssertionError('Jump scenario did not produce an impulse')
    airborne = [row for row in rows if row['groundDistance'] < 0]
    if not airborne:
        raise AssertionError('No airborne samples')
    peak = max(airborne, key=precise_y)
    landing = next((row for row in rows if row['frame'] > airborne[0]['frame'] and row['state'] == 0 and row['groundDistance'] == 0), None)
    ascending_deltas, descending_deltas = [], []
    for prev, current in zip(rows[impulse_index:], rows[impulse_index + 1:]):
        if current['groundDistance'] >= 0:
            continue
        delta = current['vyRaw'] - prev['vyRaw']
        if prev['vyRaw'] > 0:
            ascending_deltas.append(delta)
        else:
            descending_deltas.append(delta)
    return {
        'impulseFrame': rows[impulse_index]['frame'],
        'initialImpulseRaw': rows[impulse_index]['vyRaw'],
        'firstAirborneFrame': airborne[0]['frame'],
        'peakFrame': peak['frame'], 'peakY': peak['y'],
        'riseIntegerPixels': peak['y'] - initial['y'],
        'risePrecisePixels': precise_y(peak) - precise_y(initial),
        'landingFrame': landing['frame'] if landing else None,
        'ascendingVelocityDeltaCounts': dict(Counter(ascending_deltas)),
        'descendingVelocityDeltaCounts': dict(Counter(descending_deltas)),
    }

def run_scenario(probe, name, state_path, slot, sequence, out, is_jump=False):
    probe.load(state_path)
    probe.frame = 0
    probe.patches = []
    initial = sample(probe, slot, [])
    rows = []
    for action in sequence:
        for _ in range(action['frames']):
            probe.run(1, action['buttons'])
            rows.append(sample(probe, slot, action['buttons']))
    result = {
        'name': name, 'startStateSha256': digest(state_path),
        'initial': initial, 'sequence': sequence, 'patches': list(probe.patches),
        'trace': rows,
        'horizontal': {
            'firstTwelveVxRaw': [row['vxRaw'] for row in rows[:12]],
            'firstTwelveTargetVxRaw': [row['targetVxRaw'] for row in rows[:12]],
            'lastVxRaw': rows[-1]['vxRaw'],
            'lastX': rows[-1]['x'],
        },
    }
    if is_jump:
        result['jump'] = jump_metrics(initial, rows)
    (out / f'{name}.json').write_text(json.dumps(result, indent=2) + '\n')
    probe.screenshot(out / f'{name}-last.png')
    if probe.patches:
        raise AssertionError('Unintended RAM modification')
    return result

def seq(*actions):
    return [{'frames': frames, 'buttons': list(buttons)} for frames, buttons in actions]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--core', type=Path, default=DEFAULT_CORE)
    parser.add_argument('--rom', default='/Users/sevenone./Downloads/Donkey Kong Country (USA) (Rev 2).zip')
    parser.add_argument('--ground-state', type=Path, default=DEFAULT_GROUND)
    parser.add_argument('--output', type=Path, default=DEFAULT_WORK / 'runtime-rom/player-motion')
    parser.add_argument('--report', type=Path, default=Path(__file__).resolve().parents[1] / 'reference/runtime-player-analysis.json')
    args = parser.parse_args()
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    probe = SnesProbe(args.core, args.rom, out)
    probe.record_audio = False
    scenarios = {}
    try:
        initial_cases = [
            ('dk-jump-held', seq((65, ['B'])), True),
            ('dk-jump-tap', seq((1, ['B']), (64, [])), True),
            ('dk-jump-release12', seq((12, ['B']), (53, [])), True),
            ('dk-walk', seq((120, ['Right'])), False),
            ('dk-walk-stop', seq((30, ['Right']), (30, [])), False),
            ('dk-roll-to-run', seq((60, ['Right', 'Y'])), False),
            ('dk-roll-tap', seq((15, ['Right']), (1, ['Right', 'Y']), (34, ['Right'])), False),
            ('dk-stationary-roll', seq((45, ['Y'])), False),
            ('dk-heldY-then-walk', seq((40, ['Y']), (35, ['Right', 'Y'])), False),
        ]
        for name, sequence, is_jump in initial_cases:
            scenarios[name] = run_scenario(probe, name, args.ground_state, 2, sequence, out, is_jump)

        rescue = run_scenario(probe, 'diddy-rescue-and-swap', args.ground_state, 2, RESCUE_SEQUENCE, out)
        if probe.u16(0x056F) != 2 or probe.u16(0x102D) != 0:
            raise AssertionError('Natural Diddy rescue/swap did not reach idle Diddy')
        diddy_state = out / 'diddy-idle.state'
        probe.save(diddy_state)
        rescue['endStateSha256'] = digest(diddy_state)
        scenarios['diddy-rescue-and-swap'] = rescue
        diddy_cases = [
            ('diddy-jump-held', seq((65, ['B'])), True),
            ('diddy-jump-tap', seq((1, ['B']), (64, [])), True),
            ('diddy-walk', seq((35, ['Right'])), False),
            ('diddy-roll-to-run', seq((35, ['Right', 'Y'])), False),
        ]
        for name, sequence, is_jump in diddy_cases:
            scenarios[name] = run_scenario(probe, name, diddy_state, 4, sequence, out, is_jump)

        assert scenarios['dk-jump-held']['jump']['initialImpulseRaw'] == 1792
        assert scenarios['diddy-jump-held']['jump']['initialImpulseRaw'] == 2138
        assert scenarios['dk-jump-held']['jump']['descendingVelocityDeltaCounts'] == {-72: len([r for r in scenarios['dk-jump-held']['trace'] if r['groundDistance'] < 0 and r['vyRaw'] < 0]) - 1}
        report = {
            'romSha256': probe.rom_sha, 'coreSha256': digest(args.core),
            'corePath': str(args.core.resolve()), 'frontend': 'scripts/snes_probe.py',
            'frontendSha256': digest(Path(__file__).with_name('snes_probe.py')),
            'fps': probe.av.timing.fps,
            'groundStatePath': str(args.ground_state.resolve()),
            'groundStateSha256': digest(args.ground_state),
            'groundProvenance': 'Existing Jungle idle state; adjacent ground/trace.json has patches: []. This probe loads that state, then uses controller input only.',
            'allRamPatches': [], 'scenarios': scenarios,
            'limitations': [
                'Snes9x libretro emulator execution, not physical SNES hardware.',
                'Each scenario reloads the same hashed state; the rescue/swap sequence is normal controller input and changes no RAM directly.',
                'WRAM semantic names are source-guided and corroborated by controlled input and observed motion.',
                'Frame numbers count retro_run calls after loading, not absolute game frames.',
                'Core rate is approximately 60.0988 Hz; web conversions using 60 Hz are a deliberate small timing approximation.',
                'Measurements cover early Jungle ground and this starting state, not all terrain, every level, mounts, damage states or platform contacts.',
            ],
        }
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps({'report': str(args.report), 'scenarios': len(scenarios), 'jumps': {n: s['jump'] for n, s in scenarios.items() if 'jump' in s}}, indent=2))
    finally:
        probe.close()

if __name__ == '__main__':
    main()
