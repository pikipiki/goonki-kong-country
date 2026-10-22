import { BUDDY_PHYSICS } from '../../animals'
import { mineBirdHasCloseBee } from '../../routeSafety'
import { ROM, rawSpeed } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Enemy } from '../types'
import type { PlayingEnv } from './playingEnv'

export function tryStompEnemy(
  game: Game,
  enemy: Enemy,
  env: PlayingEnv,
  boss: boolean,
  height: number,
): {
  applied: boolean
  damaged: boolean
} {
  const player = game.player
  const { water, cart, oldY } = env
  const mount = game.mount
  const spiked = enemy.kind === 'bee' && enemy.pattern !== 'necky'
  const stomp =
    !mount && !water && player.vy < -0.5 && oldY >= enemy.y + height - 0.18
  if (!stomp || spiked || (enemy.kind === 'armored' && player.active !== 0)) {
    return { applied: false, damaged: false }
  }
  const damaged = !boss || enemy.vulnerable
  player.y = enemy.y + height
  player.grounded = false
  player.vy = rawSpeed(ROM.bounce[player.active])
  if (
    game.level.originalTerrain === 'mineCart' &&
    mineBirdHasCloseBee(enemy, game.level.enemies)
  ) {
    player.vy = Math.max(player.vy, 16)
    player.cartRebound = true
  }
  if (cart && !boss) {
    player.invincible = Math.max(player.invincible, 0.18)
  }
  game.onEvent('bounce')
  return { applied: true, damaged }
}

export function tryRollEnemy(game: Game, enemy: Enemy, boss: boolean): boolean {
  const player = game.player
  const spiked = enemy.kind === 'bee' && enemy.pattern !== 'necky'
  if (player.roll <= 0 || spiked || boss) {
    return false
  }
  player.rollChain++
  player.rollSpeed = Math.min(
    BUDDY_PHYSICS.chainCap,
    player.rollSpeed + BUDDY_PHYSICS.chainIncrement,
  )
  player.roll = Math.max(player.roll, 0.32)
  return true
}
