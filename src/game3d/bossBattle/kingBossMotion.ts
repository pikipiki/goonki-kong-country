import type { Group } from 'three'
import type { Enemy, Game } from '../../game/engine'

function rootRotationZ(
  phase: string,
  lying: boolean,
  phaseTime: number,
  totalTime: number,
) {
  if (lying) {
    return -Math.PI / 2
  }

  if (phase === 'getUp') {
    return (-Math.PI / 2) * Math.max(0, 1 - phaseTime)
  }

  if (phase === 'run') {
    return -0.12
  }

  if (phase === 'hurt') {
    return 0.15 * Math.sin(totalTime * 35)
  }

  return 0
}

function armRotationZ(
  phase: string,
  phaseTime: number,
  totalTime: number,
  armIdx: number,
) {
  if (phase === 'throw') {
    return -1.6 * Math.min(1, phaseTime / 0.65)
  }

  if (phase === 'rain') {
    return -1.1
  }

  if (phase === 'jump') {
    return -0.8
  }

  let runSwing
  if (phase === 'run') {
    runSwing = 0.65
  } else {
    runSwing = 0.05
  }

  return Math.sin(totalTime * 10 + armIdx * Math.PI) * runSwing
}

function legRotationZ(phase: string, totalTime: number, legIdx: number) {
  if (phase === 'run') {
    return Math.sin(totalTime * 18 + legIdx * Math.PI) * 0.55
  }

  if (phase === 'jump') {
    return 0.45
  }

  return 0
}

function capeMotion(phase: string, totalTime: number) {
  let rotation = 0.1 + Math.sin(totalTime * 4) * 0.06

  if (phase === 'run') {
    rotation = 0.3
  }

  if (phase === 'jump') {
    rotation = 0.5
  }

  let scaleY
  if (phase === 'jump') {
    scaleY = 0.8
  } else {
    scaleY = 1
  }

  return { rotation, scaleY }
}

export function animateKingBoss(
  enemy: Enemy,
  game: Game | undefined,
  refs: {
    root: Group | null
    crown: Group | null
    arms: Group | null
    legs: Group | null
    cape: Group | null
  },
) {
  const battle = game?.bossBattle

  const totalTime = battle?.totalTime ?? enemy.timer

  const phase = battle?.phase ?? 'intro'

  const phaseTime = battle?.phaseTime ?? 0

  const lying = phase === 'fakeDeath' || phase === 'dead'

  if (refs.root) {
    refs.root.rotation.z = rootRotationZ(phase, lying, phaseTime, totalTime)
    if (lying) {
      refs.root.position.y = 0.55
    } else {
      refs.root.position.y = 0
    }
  }

  if (refs.crown) {
    refs.crown.visible = battle?.crowned ?? true
  }

  refs.arms?.children.forEach((arm, armIdx) => {
    arm.rotation.z = armRotationZ(phase, phaseTime, totalTime, armIdx)
  })
  refs.legs?.children.forEach((leg, legIdx) => {
    leg.rotation.z = legRotationZ(phase, totalTime, legIdx)
  })

  if (refs.cape) {
    const motion = capeMotion(phase, totalTime)

    refs.cape.rotation.z = motion.rotation
    refs.cape.scale.y = motion.scaleY
  }
}
