import { clamp } from '../math'
import type { Game } from '../gameSession'
import type { Input } from '../types'
import type { PlayingEnv } from './playingEnv'
import { updateCompanionTrail } from './stepPlayerCompanion'
import {
  clampPlayerWaterSurface,
  resolvePlayerTerrain,
} from './stepPlayerTerrain'
export function runPlayerResolve(
  game: Game,
  input: Input,
  deltaTime: number,
  env: PlayingEnv,
): boolean {
  const player = game.player
  const { swapping } = env
  const wasGrounded = player.grounded
  const oldY = player.y
  const oldX = player.x
  env.oldX = oldX
  env.oldY = oldY
  player.x = clamp(player.x + player.vx * deltaTime, -2, game.level.length + 1)
  if (game.level.breakableWalls?.length) {
    game.resolveBreakableWalls(player, oldX)
  }
  if (game.originalRoute) {
    const minX = 0
    if (player.x < minX) {
      player.x = minX
      player.vx = Math.max(0, player.vx)
    }
  }
  if (game.tryEnterBonus(input, oldX)) {
    return true
  }
  player.y += player.vy * deltaTime
  player.grounded = false
  clampPlayerWaterSurface(game, player)
  const onGround = resolvePlayerTerrain(game, player, wasGrounded, oldX, oldY)
  if (player.y < -8) {
    game.damage(true)
    return true
  }
  if (onGround) {
    player.launched = 0
    player.rollJumpMomentum = 0
    player.cartRebound = false
  }
  game.updateAnimals(input, oldY, deltaTime)
  updateCompanionTrail(game, swapping)
  game.updateItemCaches(player, input)
  game.maybeSignHint(player)
  game.collectAnimalTokens(player)
  return false
}
