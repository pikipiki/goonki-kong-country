#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE_PATH = ROOT / "src/game/engine.ts"
OUT = ROOT / "src/game/engine"


def slice_lines(lines: list[str], start: int, end: int) -> str:
    return "".join(lines[start - 1 : end])


def main() -> None:
    lines = ENGINE_PATH.read_text().splitlines(keepends=True)
    OUT.mkdir(parents=True, exist_ok=True)

    json_imports = """import evidence from '../../../reference/rom-analysis.json'
import playerEvidence from '../../../reference/player-states.json'
import neckyEvidence from '../../../reference/necky-ballistics.json'
import underwaterMotion from '../../../reference/underwater-motion.json'

"""

    rom_body = slice_lines(lines, 62, 64) + slice_lines(lines, 69, 106)
    rom_exports = rom_body.replace("const THROW =", "export const THROW =").replace(
        "const CANNON_TEMPLATE =", "export const CANNON_TEMPLATE ="
    ).replace("const CANNON_VECTORS =", "export const CANNON_VECTORS =").replace(
        "const JUMP_IMPULSE_DELAY_FRAMES =", "export const JUMP_IMPULSE_DELAY_FRAMES ="
    ).replace("const NECKY_NUT =", "export const NECKY_NUT =").replace(
        "const NECKY_SHOOT_PERIOD =", "export const NECKY_SHOOT_PERIOD ="
    ).replace("const WORLD_PIXELS =", "export const WORLD_PIXELS =").replace(
        "const rawSpeed =", "export const rawSpeed ="
    ).replace("const ROM_SWIM_HORIZONTAL =", "export const ROM_SWIM_HORIZONTAL =").replace(
        "const ROM_SWIM_SINK =", "export const ROM_SWIM_SINK ="
    ).replace("const ROM_SWIM_IDLE_SINK =", "export const ROM_SWIM_IDLE_SINK =").replace(
        "const ROM_SWIM_RISE =", "export const ROM_SWIM_RISE ="
    ).replace("const ROM_SWIM_DIVE =", "export const ROM_SWIM_DIVE =").replace(
        "const THROW_TARGET_VX =", "export const THROW_TARGET_VX ="
    ).replace("const rawAcceleration =", "export const rawAcceleration =")
    (OUT / "romPhysics.ts").write_text(json_imports + rom_exports)

    (OUT / "types.ts").write_text(
        "import type { EnemySpec } from '../levels'\n"
        "import type { BossPhase } from '../bossBattle'\n\n"
        + slice_lines(lines, 65, 68)
        + slice_lines(lines, 107, 194)
    )

    (OUT / "cannonLaunch.ts").write_text(
        "import { CANNON_VECTORS, rawSpeed } from './romPhysics'\n\n"
        + slice_lines(lines, 195, 215)
    )

    (OUT / "math.ts").write_text(
        "import { rawSpeed } from './romPhysics'\n\n"
        + slice_lines(lines, 216, 227)
        + "\n\n"
        + slice_lines(lines, 2082, 2085)
    )

    (OUT / "enemyPresence.ts").write_text(
        "import type { Game } from './gameSession'\n"
        "import type { Enemy, Input } from './types'\n\n"
        + slice_lines(lines, 228, 232)
        + "\n"
        + slice_lines(lines, 234, 277)
    )

    (OUT / "save.ts").write_text(
        "import { LEVELS } from '../levels'\n"
        "import { clamp } from './math'\n"
        "import type { Save } from './types'\n\n"
        + slice_lines(lines, 278, 301).replace(
            "const defaultSave", "export const defaultSave"
        )
    )

    game_imports = slice_lines(lines, 1, 61)
    bridge = """
import {
  STEP,
  TEAM_SWAP_DURATION,
  ROM,
  THROW,
  CANNON_TEMPLATE,
  CANNON_VECTORS,
  JUMP_IMPULSE_DELAY_FRAMES,
  NECKY_SHOOT_PERIOD,
  ROM_SWIM_HORIZONTAL,
  ROM_SWIM_SINK,
  ROM_SWIM_IDLE_SINK,
  ROM_SWIM_RISE,
  ROM_SWIM_DIVE,
  THROW_TARGET_VX,
  rawSpeed,
  rawAcceleration,
  romSwimIdleSink,
} from './romPhysics'
import { clamp, approach, approachFootVelocity } from './math'
import { cannonLaunchVelocity } from './cannonLaunch'
import { defaultSave, readSave } from './save'
import type {
  TeamSwap,
  Key,
  Phase,
  Input,
  Enemy,
  Particle,
  Thrown,
  EnemyShot,
  Save,
  Player,
} from './types'
import { updatePlayingFrame } from './updatePlayingFrame'

export { readSave } from './save'
export { cannonLaunchVelocity } from './cannonLaunch'
export { testApproachFootVelocity } from './math'
export {
  emptyInput,
  enemyViewportBand,
  enemyVisibleToCamera,
  enemySimulationActive,
  enemyRenderVisible,
} from './enemyPresence'
export * from './types'
export { STEP, TEAM_SWAP_DURATION, ROM, romSwimIdleSink } from './romPhysics'

"""
    class_part = slice_lines(lines, 302, 1179)
    class_part += "  update(input: Input, dt = STEP) {\n    updatePlayingFrame(this, input, dt)\n  }\n}\n"

    (OUT / "gameSession.ts").write_text(game_imports + bridge + class_part)

    update_body = slice_lines(lines, 1181, 2078)
    (OUT / "updatePlayingFrame.ts").write_text(
        game_imports
        + """
import {
  STEP,
  TEAM_SWAP_DURATION,
  ROM,
  THROW,
  CANNON_TEMPLATE,
  NECKY_SHOOT_PERIOD,
  ROM_SWIM_HORIZONTAL,
  ROM_SWIM_SINK,
  ROM_SWIM_IDLE_SINK,
  ROM_SWIM_RISE,
  ROM_SWIM_DIVE,
  THROW_TARGET_VX,
  JUMP_IMPULSE_DELAY_FRAMES,
  rawSpeed,
  rawAcceleration,
} from './romPhysics'
import { clamp, approach, approachFootVelocity } from './math'
import { cannonLaunchVelocity } from './cannonLaunch'
import type { Game } from './gameSession'
import type { Input } from './types'

export function updatePlayingFrame(game: Game, input: Input, dt: number): void {
"""
        + update_body
        + "}\n"
    )

    (OUT / "index.ts").write_text(
        """export * from './types'
export * from './romPhysics'
export { clamp, approach, approachFootVelocity, testApproachFootVelocity } from './math'
export { cannonLaunchVelocity } from './cannonLaunch'
export {
  emptyInput,
  enemyViewportBand,
  enemyVisibleToCamera,
  enemySimulationActive,
  enemyRenderVisible,
} from './enemyPresence'
export { readSave } from './save'
export { Game } from './gameSession'
"""
    )

    ENGINE_PATH.write_text("export * from './engine/index'\n")
    print("Split complete:", OUT)


if __name__ == "__main__":
    main()
