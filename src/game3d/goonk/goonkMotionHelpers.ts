import { ANIMAL_DESIGNS } from '../../game/animals'
import type { Game } from '../../game/engine'
import { pick } from '../../utils/pick'

export function goonkRootScale(
  pink: boolean,
  cart: boolean,
  riding: boolean,
  swimming: boolean,
) {
  let base
  if (pink) {
    base = 2.2
  } else {
    base = 2.05
  }

  if (cart) {
    return base * 0.83
  }

  if (riding) {
    return base * 0.78
  }

  if (swimming) {
    return base * 0.85
  }

  return base
}

export function goonkWalkingSpeed(
  preview: boolean,
  mapWalk: number,
  cart: boolean,
  riding: boolean,
  velocityX: number,
) {
  if (preview) {
    return mapWalk
  }

  if (cart || riding) {
    return 0
  }

  return Math.abs(velocityX)
}

export function goonkBodyTiltZ(
  tick: number,
  roll: boolean,
  rollAngle: number,
  rollFacing: number,
  cannonFlight: boolean,
  facing: number,
  swapping: boolean,
  companion: boolean,
  swapHop: number,
  pink: boolean,
  swimming: boolean,
  poseFacing: number,
) {
  if (roll) {
    return -rollAngle * rollFacing
  }

  if (cannonFlight) {
    return tick * 14 * facing
  }

  if (swapping) {
    return pick(companion, -1, 1) * swapHop * pick(pink, 0.35, 0.85)
  }

  if (swimming) {
    return -poseFacing * (Math.PI / 2 + Math.sin(tick * 4) * 0.035)
  }

  return Math.sin(tick * 2.1) * 0.025
}

export function applyMountPosition(
  root: { position: { set: (x: number, y: number, z: number) => void } },
  mount: NonNullable<Game['mount']>,
  player: Game['player'],
) {
  root.position.set(
    player.x - player.facing * 0.12,
    player.y + ANIMAL_DESIGNS[mount.kind].seat - 0.03,
    0.2,
  )
}
