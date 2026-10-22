import { particles as settings } from '../../../config/presentation.json'
import { type Game } from '../gameSession'
import { type Input } from '../types'
export function tickParticles(game: Game, deltaTime: number) {
  const particles = game.particles
  let aliveCount = 0
  for (const particle of particles) {
    particle.age += deltaTime
    if (particle.age < settings.lifetimeSeconds)
      particles[aliveCount++] = particle
  }
  particles.length = aliveCount
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

export function tickPlayerCannonLock(game: Game) {
  const player = game.player

  if (player.cannonLock < 0) {
    return
  }

  const barrel = game.level.barrels.at(player.cannonLock)

  const source = barrel ? game.cannonPosition(player.cannonLock) : null

  if (!source || Math.hypot(player.x - source.x, player.y - source.y) > 1.7) {
    player.cannonLock = -1
  }
}
