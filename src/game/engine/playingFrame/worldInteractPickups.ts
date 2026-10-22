import { tr } from '../../../i18n'
import { ANIMAL_DESIGNS } from '../../animals'
import { ROM } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Player } from '../types'
import { pick } from '../../../utils/pick'

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
      game.onEvent(pick(amount > 1, 'banana-bunch', 'banana'))

      if (game.bananas >= ROM.bananas) {
        game.bananas -= ROM.bananas
        game.lives++
        game.pop(player.x, player.y + 2, tr('game.extraLife'))
        game.onEvent('life')
      }
    }
  })
}
