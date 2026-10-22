import type { Game } from '../gameSession'
import type { Input } from '../types'
import { tickPlayerCannonLock } from './playerCannonLockTimer'

export function tickParticles(game: Game, deltaTime: number) {
  game.particles.forEach((particle) => {
    particle.age += deltaTime
  })
  game.particles = game.particles.filter((particle) => particle.age < 1.3)
}

export function tickPlayerTimers(
  game: Game,
  input: Input,
  deltaTime: number,
  cart: boolean,
) {
  const player = game.player

  const mounted = player.mount >= 0

  if (!cart || player.grounded || mounted) {
    player.cartRebound = false
  }

  player.invincible = Math.max(0, player.invincible - deltaTime)
  player.launched = Math.max(0, player.launched - deltaTime)

  tickPlayerCannonLock(game)

  player.roll = Math.max(0, player.roll - deltaTime)
  player.mountAttack = Math.max(0, player.mountAttack - deltaTime)
  player.mountCooldown = Math.max(0, player.mountCooldown - deltaTime)
  if (
    (input.held.has('run') || input.held.has('action')) &&
    (input.held.has('left') || input.held.has('right'))
  ) {
    player.recentRun = 0
  } else {
    player.recentRun = player.recentRun + deltaTime
  }

  if (player.roll === 0) {
    player.rollJump = false
    player.rollChain = 0
  }

  if (player.roll > 0) {
    player.rollAngle += Math.abs(player.vx) * deltaTime * 3.4
  } else {
    player.rollAngle = 0
  }

  let jumpBuffer
  if (cart) {
    jumpBuffer = 0.22
  } else {
    jumpBuffer = 0.13
  }

  if (input.pressed.has('jump')) {
    player.buffer = jumpBuffer
  } else {
    player.buffer = Math.max(0, player.buffer - deltaTime)
  }
  if (player.grounded) {
    player.coyote = 0.1
  } else {
    player.coyote = Math.max(0, player.coyote - deltaTime)
  }
}
