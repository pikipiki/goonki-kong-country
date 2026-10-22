import { type Game } from '../gameSession'
import { type Input } from '../types'
import { type PlayingEnv } from './playingEnv'
import { runMountActions } from './mountActionStep'
import { cannonMomentumDuration } from '../../routeSafety'
import { cannonLaunchVelocity } from '../cannonLaunch'
import { CANNON_TEMPLATE, rawSpeed, THROW } from '../romPhysics'
import { BOSS_CARRY } from '../../bossArena'
import { BUDDY_PHYSICS } from '../../animals'
export function runCannonAndActions(
  game: Game,
  input: Input,
  deltaTime: number,
  env: PlayingEnv,
): boolean {
  const cannonHeld = runCannonFire(game, input, deltaTime)
  if (cannonHeld) {
    return true
  }
  const actionUsed = runMountActions(game, input, deltaTime)
  const mount = game.mount
  const chargeable = mount?.kind === 'rambi' || mount?.kind === 'enguarde'
  runThrowAndRoll(game, input, env, actionUsed)
  env.chargeable = chargeable
  return false
}

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

export function runThrowAndRoll(
  game: Game,
  input: Input,
  env: PlayingEnv,
  actionUsed: boolean,
) {
  const player = game.player

  const { water, cart, swapping } = env

  const carryingAtStart = player.carry >= 0

  if (actionUsed || water || cart || player.launched !== 0 || swapping) {
    return
  }

  const releaseThrow =
    (!input.tapAction && input.released.has('action')) ||
    ((input.clickMode || input.tapAction) && input.pressed.has('action'))

  const barrelNear = game.throwableBarrelIndex(player)

  if (carryingAtStart && releaseThrow) {
    releaseCarriedBarrel(game, input)
    return
  }

  if (carryingAtStart) {
    return
  }

  let pickupBarrel
  if (input.clickMode || input.tapAction) {
    pickupBarrel = input.pressed.has('action') && barrelNear >= 0
  } else {
    pickupBarrel = input.held.has('action') && barrelNear >= 0
  }

  if (pickupBarrel) {
    player.carry = barrelNear
    game.usedBarrels.add(barrelNear)
    game.onEvent('pickup')
    return
  }

  tryStartRoll(game, input, barrelNear)
}

function releaseCarriedBarrel(game: Game, input: Input) {
  const player = game.player

  if (player.grounded && input.held.has('down')) {
    game.usedBarrels.delete(player.carry)
    player.carry = -1
    game.onEvent('place')
    return
  }

  game.thrown.push({
    x: player.x + player.facing * (game.bossBattle ? BOSS_CARRY.x : 0.7),
    y: player.y + (game.bossBattle ? BOSS_CARRY.y : 1),
    vx: player.facing * rawSpeed(THROW.horizontalInitialMagnitudeRaw),
    vy: rawSpeed(THROW.verticalRaw),
    active: true,
  })
  player.carry = -1
  game.onEvent('throw')
}

export function tryStartRoll(game: Game, input: Input, barrelNear: number) {
  const player = game.player

  if (
    !input.pressed.has('action') ||
    !player.grounded ||
    player.roll !== 0 ||
    barrelNear >= 0
  ) {
    return
  }

  player.roll = 0.48
  player.rollJump = true
  player.rollChain = 0
  player.rollAngle = 0
  player.rollFacing =
    Number(input.held.has('right')) - Number(input.held.has('left')) ||
    player.facing
  player.facing = player.rollFacing
  let base = BUDDY_PHYSICS.rollStill

  if (player.recentRun < BUDDY_PHYSICS.recentRunSeconds) {
    base = BUDDY_PHYSICS.rollRunning
  } else if (input.held.has('right') || input.held.has('left')) {
    base = BUDDY_PHYSICS.rollMoving
  }

  player.rollSpeed = base * (player.active ? 1 : 1.125)
  game.onEvent('roll')
}
