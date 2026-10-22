import { tr } from '../../../i18n'
import type { Game } from '../gameSession'
import type { Player } from '../types'

export function interactLevelBarrels(game: Game, player: Player) {
  const mounted = game.player.mount >= 0

  game.level.barrels.forEach((barrel, barrelIndex) => {
    let position
    if (barrel.kind === 'cannon') {
      position = game.cannonPosition(barrelIndex)
    } else {
      position = barrel
    }

    let outOfReach
    if (barrel.kind === 'cannon') {
      outOfReach = position.y < player.y - 0.75 || position.y > player.y + 2.1
    } else {
      outOfReach = Math.abs(position.y - player.y) > 1.1
    }

    if (
      game.usedBarrels.has(barrelIndex) ||
      Math.abs(position.x - player.x) > 0.8 ||
      outOfReach
    ) {
      return
    }

    if (barrel.kind === 'rescue') {
      player.hp = 2
      game.usedBarrels.add(barrelIndex)
      game.onEvent('rescue')
      game.pop(barrel.x, barrel.y + 2, tr('game.together'), '#f4a9d5')
    }

    if (barrel.kind === 'checkpoint') {
      game.checkpoint = { x: barrel.x, y: barrel.y }
      game.usedBarrels.add(barrelIndex)
      game.onEvent('checkpoint')
      game.message(tr('game.checkpoint'))
      game.pop(barrel.x, barrel.y + 2, '✓', '#b5e7a0')
    }

    if (
      barrel.kind === 'cannon' &&
      player.cannonLock !== barrelIndex &&
      !mounted
    ) {
      player.cannon = barrelIndex
      player.cannonTime = 0
      player.launched = 0
      player.carry = -1
      player.roll = 0
      player.rollJump = false
      player.rollJumpMomentum = 0
      game.onEvent('enter-cannon')
      player.x = position.x
      player.y = position.y
      player.vx = 0
      player.vy = 0
      let cannonHint
      if (barrel.autoFire) {
        cannonHint = tr('game.cannonAuto')
      } else {
        cannonHint = tr('game.cannonManual')
      }

      game.message(cannonHint)
    }
  })
}
