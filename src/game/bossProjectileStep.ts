import type { BossActor, BossBattle, BossProjectile } from './bossBattleTypes'

function stepCrownProjectile(
  state: BossBattle,
  actor: BossActor,
  shot: BossProjectile,
  delta: number,
): void {
  if (
    !shot.returning &&
    (shot.x < state.left - 0.7 || shot.x > state.right + 0.7)
  ) {
    shot.returning = true
    shot.vx *= -1
  }

  shot.x += shot.vx * delta
  shot.y = 1.35 + Math.sin(shot.age * 5) * 0.08

  if (shot.returning && Math.abs(shot.x - actor.x) < 0.7) {
    shot.active = false
  }
}

function stepCannonballProjectile(
  shot: BossProjectile,
  delta: number,
  onEvent: (name: string) => void,
): void {
  if (shot.warning > 0) {
    shot.warning = Math.max(0, shot.warning - delta)
    return
  }

  const impactLeft = shot.impact ?? 0

  if (impactLeft > 0) {
    shot.impact = Math.max(0, impactLeft - delta)
    return
  }

  shot.motionClock = (shot.motionClock ?? 0) + delta

  while (shot.motionClock >= 1 / 30 && shot.active) {
    shot.motionClock -= 1 / 30
    shot.vy -= 21 / 30
    shot.y += shot.vy / 30

    if (shot.y <= shot.height / 2 && shot.vy < 0) {
      shot.y = shot.height / 2

      if (!shot.bounces) {
        shot.bounces = 1
        shot.vy = 6
        shot.impact = 0.1
        shot.motionClock = 0
        onEvent('boss-ball-impact')
        break
      }

      shot.active = false
    }
  }
}

export function stepBossProjectiles(
  state: BossBattle,
  actor: BossActor,
  shots: BossProjectile[],
  delta: number,
  onEvent: (name: string) => void,
): void {
  for (const shot of shots) {
    if (!shot.active) {
      continue
    }

    shot.age += delta
    shot.rotation += delta * (shot.kind === 'crown' ? 12 : 4)

    if (shot.kind === 'crown') {
      stepCrownProjectile(state, actor, shot, delta)
    } else {
      stepCannonballProjectile(shot, delta, onEvent)
    }
  }
}
