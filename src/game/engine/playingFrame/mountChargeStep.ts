import type { Game } from '../gameSession'
import type { Input } from '../types'

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
    player.mountAttack = 0.32
    game.onEvent('roll')
    return chargeable
  }
  if (chargeable && input.held.has('action')) {
    player.mountCharge = Math.min(0.75, player.mountCharge + deltaTime)
    if (player.mountCharge > 0.18) {
      player.mountAttack = 0
    }
  } else if (chargeable && player.mountCharge > 0) {
    if (player.mountCharge >= 0.65) {
      player.mountAttack = 0.85
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
