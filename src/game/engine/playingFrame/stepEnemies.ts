import type { Game } from '../gameSession'
import type { Input } from '../types'
import type { PlayingEnv } from './playingEnv'
import { resolveEnemyCombat } from './enemyCombatStep'
import { advanceEnemyMotion } from './enemyMotionStep'

export function runEnemies(
  game: Game,
  input: Input,
  deltaTime: number,
  env: PlayingEnv,
): void {
  for (const enemy of game.enemies) {
    if (advanceEnemyMotion(game, enemy, deltaTime, env)) {
      continue
    }
    resolveEnemyCombat(game, enemy, env)
  }
}
