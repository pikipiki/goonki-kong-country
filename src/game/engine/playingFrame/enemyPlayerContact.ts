import { ANIMAL_DESIGNS, ENGUARDE_SWIM_BODY } from '../../animals'
import type { Game } from '../gameSession'
import type { Enemy } from '../types'
import type { PlayingEnv } from './playingEnv'
import { tryRollEnemy, tryStompEnemy } from './enemyStompRoll'

function mountStrikeHits(
  mount: NonNullable<Game['mount']>,
  enemy: Enemy,
  player: Game['player'],
  boss: boolean,
  oldPlayerY: number,
  enemyHeight: number,
): boolean {
  if (boss) {
    return false
  }

  if (
    mount.kind === 'rambi' &&
    enemy.kind !== 'bee' &&
    player.facing * (enemy.x - player.x) > -0.2
  ) {
    return true
  }

  if (
    mount.kind === 'enguarde' &&
    player.mountAttack > 0 &&
    player.facing * (enemy.x - player.x) > -0.2
  ) {
    return true
  }

  if (
    mount.kind === 'winky' &&
    player.vy < -0.5 &&
    oldPlayerY >= enemy.y + enemyHeight - 0.4
  ) {
    return true
  }

  return false
}

function playerBodyTop(
  game: Game,
  player: Game['player'],
  water: boolean,
): number {
  const mount = game.mount

  if (water) {
    if (mount) {
      return ENGUARDE_SWIM_BODY.height
    } else {
      return 0.95
    }
  }

  const seat = mount ? ANIMAL_DESIGNS[mount.kind].seat : 0

  return 1.35 + seat
}

export function playerOverlapsEnemy(
  game: Game,
  enemy: Enemy,
  width: number,
  height: number,
  water: boolean,
): boolean {
  const player = game.player

  const mount = game.mount

  let mountWidth
  if (mount) {
    mountWidth = ANIMAL_DESIGNS[mount.kind].width
  } else {
    mountWidth = 0.3
  }

  return (
    Math.abs(player.x - enemy.x) < width + mountWidth &&
    player.y <= enemy.y + height &&
    player.y + playerBodyTop(game, player, water) > enemy.y
  )
}

export function resolvePlayerEnemyTouch(
  game: Game,
  enemy: Enemy,
  env: PlayingEnv,
  boss: boolean,
  height: number,
  hit: boolean,
): boolean {
  const player = game.player

  const mount = game.mount

  const mountHit =
    mount && mountStrikeHits(mount, enemy, player, boss, env.oldY, height)

  const strideOver =
    mount?.kind === 'expresso' &&
    enemy.kind === 'beetle' &&
    enemy.y <= player.y + 0.1

  if (mountHit) {
    if (mount.kind === 'winky') {
      player.vy = 13.5
    }

    return true
  }

  if (strideOver) {
    return hit
  }

  const stomp = tryStompEnemy(game, enemy, env, boss, height)

  if (stomp.applied) {
    return stomp.damaged || hit
  }

  const rollHit = tryRollEnemy(game, enemy, boss)

  if (rollHit) {
    return true
  }

  if (!hit && enemy.hurt <= 0) {
    game.damage()
  }

  return hit
}
