import { cannonMomentumDuration } from '../../routeSafety'
import { cannonLaunchVelocity } from '../cannonLaunch'
import { CANNON_TEMPLATE } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Input } from '../types'

export function runCannonFire(
  game: Game,
  input: Input,
  deltaTime: number,
): boolean {
  const player = game.player
  if (player.cannon < 0) {
    return false
  }
  const barrel = game.level.barrels[player.cannon]
  player.cannonTime += deltaTime
  game.cannonTimes[player.cannon] =
    (game.cannonTimes[player.cannon] ?? 0) + deltaTime
  const position = game.cannonPosition(player.cannon)
  player.x = position.x
  player.y = position.y
  if (
    input.pressed.has('jump') ||
    input.pressed.has('action') ||
    (barrel.autoFire && player.cannonTime > 0.15)
  ) {
    const angle = game.cannonAngle(player.cannon)
    const launch = cannonLaunchVelocity(angle)
    const mult =
      (barrel.launchMultiplier ?? CANNON_TEMPLATE.launchMultiplier) /
      CANNON_TEMPLATE.launchMultiplier
    player.cannonLock = player.cannon
    player.launched = cannonMomentumDuration(barrel)
    player.cannonGravityDelay =
      barrel.cannonGravityDelay ?? CANNON_TEMPLATE.gravityDelayCounter
    player.cannonControlDelay =
      barrel.cannonControlDelay ?? CANNON_TEMPLATE.controlDelayCounter
    player.grounded = false
    player.coyote = 0
    player.roll = 0
    player.rollJump = false
    player.rollJumpMomentum = 0
    player.vx = launch.vx * mult
    player.vy = launch.vy * mult
    player.cannon = -1
    player.invincible = 1
    player.buffer = 0
    player.jumpDelay = 0
    game.onEvent('cannon')
    return false
  }
  return true
}
