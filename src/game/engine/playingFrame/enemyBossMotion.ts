import { createBossBattle, updateBossBattle } from '../../bossBattle'
import type { Game } from '../gameSession'
import type { Enemy } from '../types'

export function updateBossEnemy(
  game: Game,
  enemy: Enemy,
  deltaTime: number,
): boolean {
  if (game.bossBattle === null) {
    game.bossBattle = createBossBattle(enemy)
  }
  updateBossBattle(
    game.bossBattle,
    enemy,
    game.bossProjectiles,
    deltaTime,
    (name) => {
      game.onEvent(name)
    },
  )
  if (game.bossBattle.phase === 'dead' && game.bossBattle.phaseTime > 1.5) {
    enemy.alive = false
    game.finish()
    return true
  }
  return false
}
