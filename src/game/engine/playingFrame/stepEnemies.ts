import { type Game } from '../gameSession'
import { type Input, type Enemy } from '../types'
import { type PlayingEnv } from './playingEnv'
import { resolveEnemyCombat } from './enemyCombatStep'
import { enemySimulationActive } from '../enemyPresence'
import { updateFlyingEnemy, updateNeckyEnemy } from './enemyFlyingMotion'
import { createBossBattle, updateBossBattle } from '../../bossBattle'
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
