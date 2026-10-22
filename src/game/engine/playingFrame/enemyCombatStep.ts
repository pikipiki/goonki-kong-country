import { pick } from '../../../utils/pick'
import {
  registerBossHit,
  bossAcceptsHit,
  BOSS_MAX_HITS,
} from '../../bossBattle'
import { ENEMY_DESIGNS } from '../../enemies'
import type { Game } from '../gameSession'
import type { Enemy } from '../types'
import type { PlayingEnv } from './playingEnv'
import {
  playerOverlapsEnemy,
  resolvePlayerEnemyTouch,
} from './enemyPlayerContact'
import { enemyHitByThrown } from './enemyThrownHits'

function applyEnemyHit(
  game: Game,
  enemy: Enemy,
  hit: boolean,
  boss: boolean,
  height: number,
) {
  if (!hit || enemy.hurt > 0) {
    return
  }

  enemy.hp--
  enemy.hurt = 1
  game.onEvent('stomp')
  game.pop(
    enemy.x,
    enemy.y + height,
    pick(
      boss,
      `${String(BOSS_MAX_HITS - enemy.hp)} / ${String(BOSS_MAX_HITS)}`,
      '★',
    ),
  )

  if (boss && game.bossBattle) {
    registerBossHit(game.bossBattle, enemy, game.bossProjectiles)
  } else if (enemy.hp <= 0) {
    enemy.alive = false
  }
}

export function resolveEnemyCombat(
  game: Game,
  enemy: Enemy,
  env: PlayingEnv,
): void {
  if (!enemy.alive) {
    return
  }

  const boss = enemy.kind === 'boss'

  const height = ENEMY_DESIGNS[enemy.kind].height

  const width = ENEMY_DESIGNS[enemy.kind].width

  if (boss && game.bossBattle && !bossAcceptsHit(game.bossBattle)) {
    return
  }

  let hit = enemyHitByThrown(game, enemy, width, height)

  if (!playerOverlapsEnemy(game, enemy, width, height, env.water)) {
    applyEnemyHit(game, enemy, hit, boss, height)
    return
  }

  hit = resolvePlayerEnemyTouch(game, enemy, env, boss, height, hit)
  applyEnemyHit(game, enemy, hit, boss, height)
}
