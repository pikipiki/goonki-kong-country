import {
  teamSwapSeconds,
  jumpImpulseDelayFrames,
} from '../../config/gameplay.json'
import evidence from '../../../reference/rom-analysis.json'
import playerEvidence from '../../../reference/player-states.json'
import neckyEvidence from '../../../reference/necky-ballistics.json'
import underwaterMotion from '../../../reference/underwater-motion.json'

export const STEP = 1 / 60
/** ROM tag swap: state 17 / anim 80 lasts ~25 frames at 60 Hz. */
export const TEAM_SWAP_DURATION = teamSwapSeconds
export const ROM = {
  gravity: -evidence.findings.gravity.values.accelerationRaw,
  terminal: -evidence.findings.gravity.values.terminalVelocityRaw,
  held: [
    -evidence.findings.heldJump.values.pinkGravityRaw,
    -evidence.findings.heldJump.values.violetGravityRaw,
  ],
  bounce: [
    evidence.findings.enemyBounce.values.pinkBounceRaw,
    evidence.findings.enemyBounce.values.violetBounceRaw,
  ],
  bananas: evidence.findings.bananaLife.values.bananasPerLife,
  jump: [
    playerEvidence.findings.pinkNormalJump.values.verticalSpeedRaw,
    playerEvidence.findings.violetNormalJump.values.verticalSpeedRaw,
  ],
}

export const THROW = playerEvidence.findings.thrownObjectVelocity.values
export const CANNON_TEMPLATE = playerEvidence.findings.cannonBaseTemplate.values
export const CANNON_VECTORS = playerEvidence.cannonBaseTemplateVectors
export const JUMP_IMPULSE_DELAY_FRAMES = jumpImpulseDelayFrames
export const NECKY_NUT = neckyEvidence.engine
export const NECKY_SHOOT_PERIOD = NECKY_NUT.shootPeriodFrames / 60
export const WORLD_PIXELS = 32
export const rawSpeed = (raw: number) => ((raw / 256) * 60) / WORLD_PIXELS
export const ROM_SWIM_HORIZONTAL = rawSpeed(
  underwaterMotion.horizontalCruiseVxRaw,
)
export const ROM_SWIM_SINK =
  underwaterMotion.verticalSwim.sinkAccelerationWorldPerSecond
type SwimVerticalMotion = {
  verticalSwim: {
    sinkAccelerationWorldPerSecond: number
    riseSpeedWorld: number
    diveSpeedWorld: number
    idleSinkSpeedWorld?: number
  }
}

export function romSwimIdleSink(motion: SwimVerticalMotion = underwaterMotion) {
  const idle = motion.verticalSwim.idleSinkSpeedWorld
  if (idle !== undefined) {
    return idle
  }
  return underwaterMotion.verticalSwim.idleSinkSpeedWorld
}

export const ROM_SWIM_IDLE_SINK = romSwimIdleSink()
export const ROM_SWIM_RISE = underwaterMotion.verticalSwim.riseSpeedWorld
export const ROM_SWIM_DIVE = underwaterMotion.verticalSwim.diveSpeedWorld
export const THROW_TARGET_VX = rawSpeed(THROW.horizontalTargetMagnitudeRaw)
export const rawAcceleration = (raw: number) => rawSpeed(raw) * 60
