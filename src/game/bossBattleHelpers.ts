import type { BossBattle, BossPhase } from './bossBattleTypes'

export function setBossPhase(state: BossBattle, next: BossPhase): void {
  state.phase = next
  state.phaseTime = 0
}

export function startBossJumping(
  state: BossBattle,
  count: number,
  after: 'rain' | 'throw',
): void {
  state.jumps = count
  state.hopTime = 0
  state.afterJumps = after
  setBossPhase(state, 'jump')
}
