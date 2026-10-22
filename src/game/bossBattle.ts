import { setBossPhase } from './bossBattleHelpers'
import { updateBossPhaseMotion } from './bossBattlePhaseMotion'
import { stepBossProjectiles } from './bossProjectileStep'
import {
  BOSS_MAX_HITS,
  type BossActor,
  type BossBattle,
  type BossProjectile,
} from './bossBattleTypes'

export type {
  BossActor,
  BossBattle,
  BossPhase,
  BossProjectile,
} from './bossBattleTypes'
export { BOSS_MAX_HITS } from './bossBattleTypes'

export function createBossBattle(actor: BossActor): BossBattle {
  return {
    phase: 'intro',
    phaseTime: 0,
    hits: 0,
    maxHits: BOSS_MAX_HITS,
    crowned: true,
    facing: -1,
    left: actor.min - 1,
    right: actor.max + 1,
    passes: 0,
    jumps: 0,
    hopTime: 0,
    rainCount: 0,
    spawned: 0,
    ballClock: 0,
    afterJumps: 'throw',
    totalTime: 0,
    hurtSoundPlayed: true,
  }
}

export function registerBossHit(
  state: BossBattle,
  actor: BossActor,
  shots: BossProjectile[],
): void {
  state.hits = Math.max(state.hits + 1, state.maxHits - actor.hp)
  state.hurtSoundPlayed = false
  state.crowned = true
  actor.vulnerable = false
  actor.vx = 0
  actor.vy = 0
  actor.y = 0
  shots.forEach((shot) => {
    shot.active = false
  })
  setBossPhase(state, actor.hp <= 0 ? 'dead' : 'hurt')
}

export function bossAcceptsHit(state: BossBattle): boolean {
  return !['hurt', 'fakeDeath', 'getUp', 'dead'].includes(state.phase)
}

export function updateBossBattle(
  state: BossBattle,
  actor: BossActor,
  shots: BossProjectile[],
  delta: number,
  onEvent: (name: string) => void = () => {},
): void {
  state.phaseTime += delta
  state.totalTime += delta
  actor.vx = 0
  actor.vy = 0

  if (
    (state.phase === 'hurt' || state.phase === 'dead') &&
    !state.hurtSoundPlayed &&
    state.phaseTime >= 6 / 60 - 1e-6
  ) {
    state.hurtSoundPlayed = true
    onEvent('boss-hurt')
  }

  updateBossPhaseMotion(state, actor, shots, delta, onEvent)
  stepBossProjectiles(state, actor, shots, delta, onEvent)
  const low = state.left + 1

  const high = state.right - 1

  actor.x = Math.max(low, Math.min(high, actor.x))
  actor.vulnerable = state.phase === 'catch' && !state.crowned
  actor.bossState = state.phase
  actor.bossFacing = state.facing
  actor.bossCrowned = state.crowned
}
