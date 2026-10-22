import type { BossBattle } from '../game/bossBattle'

export function bossSpriteGroup(
  fight: BossBattle | null | undefined,
  phase: BossBattle['phase'] | undefined,
) {
  if (phase === 'intro') {
    return 'jump'
  }
  if (phase === 'run') {
    return 'run'
  }
  if (phase === 'throw') {
    return 'throw'
  }
  if (phase === 'jump') {
    return 'jump'
  }
  if (phase === 'hurt') {
    return 'hurt'
  }
  if (phase === 'fakeDeath' || phase === 'dead') {
    return 'fall'
  }
  if (phase === 'getUp') {
    return 'getUp'
  }
  if (phase === 'rain') {
    return 'rain'
  }
  if (fight?.crowned === false) {
    return 'wait'
  }
  return 'idle'
}

export function barrelObjectGroup(kind: string) {
  if (kind === 'rescue') {
    return 'dk_barrel'
  }
  if (kind === 'checkpoint') {
    return 'checkpoint_barrel'
  }
  if (kind === 'rolling') {
    return 'barrel_roll'
  }
  return 'barrel_idle'
}
