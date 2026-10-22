import type { BossActor, BossBattle, BossProjectile } from './bossBattleTypes'
import { setBossPhase, startBossJumping } from './bossBattleHelpers'
import { pick } from '../utils/pick'

type BossEvent = (name: string) => void

function updateIntroPhase(state: BossBattle, actor: BossActor): void {
  actor.y =
    Math.abs(Math.sin(Math.min(1, state.phaseTime / 1.8) * Math.PI * 3)) * 0.7

  if (state.phaseTime >= 1.8) {
    actor.y = 0
    setBossPhase(state, 'throw')
  }
}

function updateThrowPhase(
  state: BossBattle,
  actor: BossActor,
  shots: BossProjectile[],
  onEvent: BossEvent,
): void {
  actor.y = 0
  state.crowned = true

  if (state.phaseTime < 0.65) {
    return
  }

  if (actor.x > (state.left + state.right) / 2) {
    state.facing = -1
  } else {
    state.facing = 1
  }
  state.crowned = false
  shots.push({
    kind: 'crown',
    x: actor.x + state.facing * 0.9,
    y: 1.35,
    vx: state.facing * (6 + state.hits * 0.45),
    vy: 0,
    active: true,
    width: 0.38,
    height: 0.34,
    age: 0,
    warning: 0,
    returning: false,
    rotation: 0,
  })
  setBossPhase(state, 'catch')
  onEvent('boss-crown')
}

function updateCatchPhase(
  state: BossBattle,
  actor: BossActor,
  shots: BossProjectile[],
): void {
  actor.y = 0
  const hasCrown = shots.some((shot) => shot.active && shot.kind === 'crown')

  if (!hasCrown && state.phaseTime > 0.3) {
    state.crowned = true
    setBossPhase(state, 'throw')
  }
}

function updateHurtPhase(
  state: BossBattle,
  actor: BossActor,
  low: number,
  high: number,
): void {
  actor.y = 0

  if (state.phaseTime < 0.85) {
    return
  }

  if (state.hits <= 3) {
    state.passes = state.hits
    if (actor.x > (low + high) / 2) {
      state.facing = -1
    } else {
      state.facing = 1
    }
    setBossPhase(state, 'run')
  } else if (state.hits <= 6) {
    state.rainCount = [9, 17, 25][state.hits - 4]
    startBossJumping(state, 3, 'rain')
  } else if (state.hits === 7) {
    setBossPhase(state, 'fakeDeath')
  } else {
    startBossJumping(state, pick(state.hits === 8, 6, 12), 'throw')
  }
}

function updateRunPhase(
  state: BossBattle,
  actor: BossActor,
  low: number,
  high: number,
  delta: number,
): void {
  const speed = 5 + state.hits * 0.8 + (state.hits - state.passes) * 0.65

  actor.vx = state.facing * speed
  actor.x += actor.vx * delta
  actor.y = 0

  if (actor.x > low && actor.x < high) {
    return
  }

  actor.x = Math.max(low, Math.min(high, actor.x))
  state.passes--
  state.facing *= -1

  if (state.passes <= 0) {
    setBossPhase(state, 'throw')
  }
}

function updateJumpPhase(
  state: BossBattle,
  actor: BossActor,
  low: number,
  high: number,
  delta: number,
  onEvent: BossEvent,
): void {
  state.hopTime += delta
  let duration
  if (state.hits >= 7) {
    duration = 0.62
  } else {
    duration = 0.85
  }

  let height
  if (state.hits >= 7) {
    height = 2.2
  } else {
    height = 3.1
  }

  actor.vx = state.facing * pick(state.hits >= 7, 7.5, 5)
  actor.x += actor.vx * delta

  if (actor.x <= low || actor.x >= high) {
    actor.x = Math.max(low, Math.min(high, actor.x))
    state.facing *= -1
  }

  actor.y = Math.sin(Math.min(1, state.hopTime / duration) * Math.PI) * height

  if (state.hopTime < duration) {
    return
  }

  state.hopTime = 0
  state.jumps--
  actor.y = 0
  onEvent('boss-land')

  if (state.jumps > 0) {
    return
  }

  if (state.afterJumps === 'rain') {
    state.spawned = 0
    state.ballClock = 0
    setBossPhase(state, 'rain')
  } else {
    setBossPhase(state, 'throw')
  }
}

function updateRainPhase(
  state: BossBattle,
  actor: BossActor,
  shots: BossProjectile[],
  delta: number,
  onEvent: BossEvent,
): void {
  actor.y = 0
  state.ballClock += delta

  if (state.spawned < state.rainCount && state.ballClock >= 0.23) {
    state.ballClock -= 0.23
    const row = Math.floor(state.spawned / 9)

    const col = state.spawned % 9

    const spawnX =
      state.left +
      1 +
      (pick(row % 2, 8 - col, col) * (state.right - state.left - 2)) / 8

    shots.push({
      kind: 'cannonball',
      x: spawnX,
      y: 8.2,
      vx: 0,
      vy: 0,
      active: true,
      width: 0.34,
      height: 0.68,
      age: 0,
      warning: 0.55,
      returning: false,
      rotation: 0,
    })
    state.spawned++
    onEvent('boss-ball')
  }

  if (
    state.spawned >= state.rainCount &&
    !shots.some((shot) => shot.active && shot.kind === 'cannonball')
  ) {
    setBossPhase(state, 'throw')
  }
}

function updateFakeDeathPhase(state: BossBattle, actor: BossActor): void {
  actor.y = 0

  if (state.phaseTime >= 4) {
    setBossPhase(state, 'getUp')
  }
}

function updateGetUpPhase(
  state: BossBattle,
  actor: BossActor,
  onEvent: BossEvent,
): void {
  actor.y = 0

  if (state.phaseTime < 1) {
    return
  }

  startBossJumping(state, 2, 'throw')
  onEvent('boss-revive')
}

export function updateBossPhaseMotion(
  state: BossBattle,
  actor: BossActor,
  shots: BossProjectile[],
  delta: number,
  onEvent: BossEvent,
): void {
  const low = state.left + 1

  const high = state.right - 1

  switch (state.phase) {
    case 'intro':
      updateIntroPhase(state, actor)
      break
    case 'throw':
      updateThrowPhase(state, actor, shots, onEvent)
      break
    case 'catch':
      updateCatchPhase(state, actor, shots)
      break
    case 'hurt':
      updateHurtPhase(state, actor, low, high)
      break
    case 'run':
      updateRunPhase(state, actor, low, high, delta)
      break
    case 'jump':
      updateJumpPhase(state, actor, low, high, delta, onEvent)
      break
    case 'rain':
      updateRainPhase(state, actor, shots, delta, onEvent)
      break
    case 'fakeDeath':
      updateFakeDeathPhase(state, actor)
      break
    case 'getUp':
      updateGetUpPhase(state, actor, onEvent)
      break
    case 'dead':
      actor.y = 0
      break
    default:
      break
  }

  if (state.phase === 'dead') {
    actor.y = 0
  }
}
