import type { Game } from '../gameSession'
import type { Input } from '../types'
import { runMountCharge } from './mountChargeStep'

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
      player.mountAttack = 0.32
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
        Math.abs(animal.x - player.x) < 1.65 &&
        Math.abs(animal.y - player.y) < 1.8,
    )
    if (crate) {
      game.releaseAnimal(crate)
      actionUsed = true
    }
  }
  return actionUsed
}
