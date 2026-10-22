import { enemySimulationActive } from '../enemyPresence'
import type { Game } from '../gameSession'
import type { Enemy } from '../types'
import type { PlayingEnv } from './playingEnv'
import { updateBossEnemy } from './enemyBossMotion'
import { updateFlyingEnemy } from './enemyFlyingMotion'
import { updateNeckyEnemy } from './enemyNeckyMotion'

export function advanceEnemyMotion(
  game: Game,
  enemy: Enemy,
  deltaTime: number,
  env: PlayingEnv,
): boolean {
  if (!enemy.alive) {
    return true
  }
  if (enemy.kind !== 'boss' && !enemySimulationActive(game, enemy)) {
    return true
  }
  const previousEnemyY = enemy.y
  const previousEnemyX = enemy.x
  enemy.timer += deltaTime
  enemy.hurt = Math.max(0, enemy.hurt - deltaTime)
  if (enemy.kind === 'boss') {
    return updateBossEnemy(game, enemy, deltaTime)
  }
  if (enemy.pattern === 'necky') {
    updateNeckyEnemy(game, enemy, deltaTime)
    return false
  }
  if (enemy.kind === 'bee' || env.water) {
    updateFlyingEnemy(
      game,
      enemy,
      deltaTime,
      env.water,
      previousEnemyX,
      previousEnemyY,
    )
    return false
  }
  game.groundEnemy(enemy, deltaTime)
  return false
}
