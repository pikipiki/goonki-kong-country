import { mountAction as settings } from '../../../config/gameplay.json'
import { type Game } from '../gameSession'
import { type Input } from '../types'
export function runMountActions(
  game: Game,
  input: Input,
  deltaTime: number,
): boolean {
  const player = game.player
  const mount = game.mount
  let actionUsed = false
  if (input.pressed.has('action') && mount) {
    const kind = mount.kind
    if (kind === 'rambi' || kind === 'enguarde') {
      player.mountAttack = settings.quickAttackSeconds
      player.mountCharged = false
      player.mountCharge = 0
      game.onEvent('roll')
    }
    actionUsed = true
  }
  runMountCharge(game, input, deltaTime, mount)
  if (input.pressed.has('action') && !mount) {
    const crate = game.animals.find(
      (animal) =>
        animal.state === 'crate' &&
        Math.abs(animal.x - player.x) < settings.crateReachX &&
        Math.abs(animal.y - player.y) < settings.crateReachY,
    )
    if (crate) {
      game.releaseAnimal(crate)
      actionUsed = true
    }
  }
  return actionUsed
}

export function runMountCharge(
  game: Game,
  input: Input,
  deltaTime: number,
  mount: Game['mount'],
): boolean {
  const player = game.player
  const chargeable = mount?.kind === 'rambi' || mount?.kind === 'enguarde'
  const quickSwimAttack =
    mount?.kind === 'enguarde' && input.pressed.has('jump')
  if (quickSwimAttack) {
    player.mountCharge = 0
    player.mountCharged = false
    player.mountAttack = settings.quickAttackSeconds
    game.onEvent('roll')
    return chargeable
  }
  if (chargeable && input.held.has('action')) {
    player.mountCharge = Math.min(
      settings.maxChargeSeconds,
      player.mountCharge + deltaTime,
    )
    if (player.mountCharge > settings.windupDelaySeconds) {
      player.mountAttack = 0
    }
  } else if (chargeable && player.mountCharge > 0) {
    if (player.mountCharge >= settings.readyChargeSeconds) {
      player.mountAttack = settings.chargedAttackSeconds
      player.mountCharged = true
      game.onEvent('roll')
    }
    player.mountCharge = 0
  }
  if (player.mountAttack === 0) {
    player.mountCharged = false
  }
  return chargeable
}
