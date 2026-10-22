import { BOSS_CARRY } from '../../bossArena'
import { rawSpeed, THROW } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Input } from '../types'
import type { PlayingEnv } from './playingEnv'
import { tryStartRoll } from './rollAttackStep'
import { pick } from '../../../utils/pick'

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
    x: player.x + player.facing * pick(game.bossBattle, BOSS_CARRY.x, 0.7),
    y: player.y + pick(game.bossBattle, BOSS_CARRY.y, 1),
    vx: player.facing * rawSpeed(THROW.horizontalInitialMagnitudeRaw),
    vy: rawSpeed(THROW.verticalRaw),
    active: true,
  })
  player.carry = -1
  game.onEvent('throw')
}
