import type { Group } from 'three'
import type { Player } from '../../game/engine'

function bodyRollZ(player: Player | undefined, roll: boolean): number {
  if (!roll || !player) {
    return 0
  }

  return -player.rollAngle * player.rollFacing
}

function bodyFlightZ(
  player: Player | undefined,
  cannonFlight: boolean,
  animTime: number,
): number {
  if (!cannonFlight) {
    return 0
  }

  return animTime * 14 * (player?.facing ?? 1)
}

function bodySwapZ(
  companion: boolean,
  swapping: boolean,
  swapHop: number,
  pink: boolean,
): number {
  if (!swapping) {
    return 0
  }

  return (companion ? -1 : 1) * swapHop * (pink ? 0.35 : 0.85)
}

function bodySwimZ(
  poseFacing: number,
  swimming: boolean,
  animTime: number,
): number {
  if (!swimming) {
    return Math.sin(animTime * 2.1) * 0.025
  }

  return -poseFacing * (Math.PI / 2 + Math.sin(animTime * 4) * 0.035)
}

export function applyGoonkBodyRotation(
  body: Group,
  player: Player | undefined,
  companion: boolean,
  pink: boolean,
  animTime: number,
  walking: number,
  grounded: boolean,
  swimming: boolean,
  roll: boolean,
  cannonFlight: boolean,
  swapping: boolean,
  swapHop: number,
  poseFacing: number,
): void {
  let rotZ = 0

  if (roll) {
    rotZ = bodyRollZ(player, roll)
  } else if (cannonFlight) {
    rotZ = bodyFlightZ(player, cannonFlight, animTime)
  } else if (swapping) {
    rotZ = bodySwapZ(companion, swapping, swapHop, pink)
  } else {
    rotZ = bodySwimZ(poseFacing, swimming, animTime)
  }

  body.rotation.z = rotZ
  body.rotation.y = poseFacing * (walking > 0.3 ? 0.65 : 0.2)
  let baseY = 0.4

  if (roll) {
    baseY = 0.3
  } else if (swimming) {
    baseY = 0.26
  }

  let bounce
  if (grounded) {
    bounce =
      Math.abs(Math.sin(animTime * walking * 2.1)) *
      Math.min(0.045, walking * 0.01)
  } else {
    bounce = 0.025
  }

  body.position.y = baseY + bounce
  let squash
  if (grounded && walking > 0.2) {
    squash = 1 + Math.sin(animTime * walking * 4.2) * 0.025
  } else {
    squash = 1
  }

  body.scale.set(1, squash, 1)
}
