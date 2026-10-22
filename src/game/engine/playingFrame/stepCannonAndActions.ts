import type { Game } from '../gameSession'
import type { Input } from '../types'
import type { PlayingEnv } from './playingEnv'
import { runCannonFire } from './cannonFireStep'
import { runMountActions } from './mountActionStep'
import { runThrowAndRoll } from './throwRollStep'

export function runCannonAndActions(
  game: Game,
  input: Input,
  deltaTime: number,
  env: PlayingEnv,
): boolean {
  const cannonHeld = runCannonFire(game, input, deltaTime)
  if (cannonHeld) {
    return true
  }
  const actionUsed = runMountActions(game, input, deltaTime)
  const mount = game.mount
  const chargeable = mount?.kind === 'rambi' || mount?.kind === 'enguarde'
  runThrowAndRoll(game, input, env, actionUsed)
  env.chargeable = chargeable
  return false
}
