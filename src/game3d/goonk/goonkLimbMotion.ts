import type { Group } from 'three'
import type { Player } from '../../game/engine'
import { pick } from '../../utils/pick'

function animateCelebrateLimb(limb: Group, limbIdx: number, animTime: number) {
  if (limbIdx < 2) {
    limb.rotation.x = -2.15 + Math.sin(animTime * 12 + limbIdx * 1.4) * 0.35
  } else {
    limb.rotation.x = Math.sin(animTime * 10 + limbIdx * Math.PI) * 0.45
  }
  limb.rotation.z = pick(limbIdx % 2, 1, -1) * pick(limbIdx < 2, 0.38, 0.15)
}

function animateSwapLimb(
  limb: Group,
  limbIdx: number,
  swapHop: number,
  pink: boolean,
) {
  limb.rotation.x = pick(limbIdx < 2, -1.1, 0.65) * swapHop
  limb.rotation.z = pick(limbIdx % 2, 1, -1) * swapHop * pick(pink, 0.35, 1.05)
}

function limbRideZ(limbIdx: number): number {
  let side
  if (limbIdx % 2) {
    side = 1
  } else {
    side = -1
  }

  let spread
  if (limbIdx < 2) {
    spread = 0.45
  } else {
    spread = 0.7
  }

  return side * spread
}

function limbWalkRotX(
  limbIdx: number,
  animTime: number,
  walking: number,
  grounded: boolean,
  player: Player | undefined,
  companion: boolean,
): number {
  const swing = Math.sin(animTime * walking * 2.1 + (limbIdx % 2) * Math.PI)

  let rotX = Math.sin(animTime * 1.5 + limbIdx) * 0.07

  if (walking > 0.1) {
    let walkAmp
    if (limbIdx < 2) {
      walkAmp = 0.6
    } else {
      walkAmp = 0.85
    }

    rotX = swing * walkAmp
  }

  if (!grounded) {
    if (limbIdx < 2) {
      rotX = -0.6
    } else {
      rotX = 0.4
    }
  }

  if (player && player.carry >= 0 && limbIdx < 2 && !companion) {
    rotX = -2.3
  }

  return rotX
}

function applyRideLimbPose(limb: Group, limbIdx: number) {
  limb.rotation.z = limbRideZ(limbIdx)
  if (limbIdx < 2) {
    limb.rotation.x = -0.9
  } else {
    limb.rotation.x = -0.65
  }
}

function applyRollLimbPose(limb: Group, limbIdx: number, pink: boolean) {
  limb.rotation.z = pick(limbIdx % 2, 1, -1) * pick(pink, 0.18, 1.05)
  if (pink) {
    limb.rotation.x = -1.4
  } else {
    limb.rotation.x = 0
  }
}

function animateDefaultLimb(
  limb: Group,
  limbIdx: number,
  animTime: number,
  walking: number,
  grounded: boolean,
  riding: boolean,
  roll: boolean,
  pink: boolean,
  player: Player | undefined,
  companion: boolean,
) {
  limb.rotation.x = limbWalkRotX(
    limbIdx,
    animTime,
    walking,
    grounded,
    player,
    companion,
  )
  limb.rotation.z = 0

  if (riding) {
    applyRideLimbPose(limb, limbIdx)
  }

  if (roll) {
    applyRollLimbPose(limb, limbIdx, pink)
  }
}

export function animateGoonkLimbs(
  limbs: (Group | null)[],
  animTime: number,
  walking: number,
  grounded: boolean,
  pink: boolean,
  mapCelebrate: boolean,
  swapping: boolean,
  swapHop: number,
  riding: boolean,
  roll: boolean,
  player: Player | undefined,
  companion: boolean,
) {
  limbs.forEach((limb, limbIdx) => {
    if (!limb) {
      return
    }

    if (mapCelebrate) {
      animateCelebrateLimb(limb, limbIdx, animTime)
      return
    }

    if (swapping) {
      animateSwapLimb(limb, limbIdx, swapHop, pink)
      return
    }

    animateDefaultLimb(
      limb,
      limbIdx,
      animTime,
      walking,
      grounded,
      riding,
      roll,
      pink,
      player,
      companion,
    )
  })
}
