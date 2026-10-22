import { type Game } from '../gameSession'
import { type Input, type Player } from '../types'
import {
  simulateEnemyShots,
  simulateThrownBarrels,
} from './worldInteractThrown'
import { tr } from '../../../i18n'
import { ANIMAL_DESIGNS } from '../../animals'
import { ROM } from '../romPhysics'
export function runWorldInteract(
  game: Game,
  input: Input,
  deltaTime: number,
): void {
  const player = game.player
  collectLevelPickups(game, player)
  interactLevelBarrels(game, player)
  simulateThrownBarrels(game, player, deltaTime)
  simulateEnemyShots(game, player, deltaTime)
}

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

export function collectLevelPickups(game: Game, player: Player) {
  let mount
  if (game.player.mount >= 0) {
    mount = game.mount
  } else {
    mount = undefined
  }

  let mountSeat
  if (mount) {
    mountSeat = ANIMAL_DESIGNS[mount.kind].seat * 0.45
  } else {
    mountSeat = 0
  }

  let pickupReach
  if (mount) {
    pickupReach = 1.5
  } else {
    pickupReach = 1
  }

  game.level.pickups.forEach((item, pickupIndex) => {
    if (
      game.collected.has(pickupIndex) ||
      Math.abs(player.x - item.x) > 0.85 ||
      Math.abs(player.y + 0.85 + mountSeat - item.y) > pickupReach
    ) {
      return
    }

    game.collected.add(pickupIndex)

    if (item.kind === 'letter') {
      game.letters.add(pickupIndex)
      game.pop(item.x, item.y, item.letter ?? '', '#ffdf80')
      game.onEvent('letter')

      if (game.letters.size === game.letterWord.length) {
        game.lives++
        game.pop(
          player.x,
          player.y + 3,
          tr('game.letterLife', { word: game.letterWord }),
        )
        game.onEvent('life')
      }
    } else if (item.kind === 'balloon') {
      game.lives += item.amount ?? 1
      game.pop(
        item.x,
        item.y,
        tr('game.extraLifeCount', { count: item.amount ?? 1 }),
      )
      game.onEvent('life')
    } else {
      const amount = item.amount ?? 1

      game.bananas += amount
      game.levelBananas += amount
      game.total += amount
      game.onEvent(amount > 1 ? 'banana-bunch' : 'banana')

      if (game.bananas >= ROM.bananas) {
        game.bananas -= ROM.bananas
        game.lives++
        game.pop(player.x, player.y + 2, tr('game.extraLife'))
        game.onEvent('life')
      }
    }
  })
}
