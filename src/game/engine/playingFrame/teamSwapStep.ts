import { localeKeys } from '../../../i18n/keys'
import { resolveI18nKey } from '../../../i18n/resolveText'
import { TEAM_SWAP_DURATION } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Input } from '../types'
import { pick } from '../../../utils/pick'

export function runTeamSwap(
  game: Game,
  input: Input,
  deltaTime: number,
): boolean {
  const player = game.player

  const mounted = player.mount >= 0

  if (input.pressed.has('swap') && mounted) {
    game.dismount()
    return !!game.swap
  }

  if (
    input.pressed.has('swap') &&
    player.hp === 2 &&
    player.cannon < 0 &&
    !game.swap &&
    player.roll <= 0
  ) {
    player.active = 1 - player.active
    game.swap = {
      remaining: TEAM_SWAP_DURATION,
      back: { ...game.companion },
    }
    game.onEvent('swap')
    game.pop(
      player.x,
      player.y + 2,
      resolveI18nKey(
        pick(player.active, localeKeys.buddies.violet, localeKeys.buddies.rose),
      ),
      pick(player.active, '#c0a2ff', '#f6a4c9'),
    )
  }

  if (game.swap) {
    game.swap.remaining -= deltaTime

    if (game.swap.remaining <= 0) {
      game.companion = {
        x: player.x - player.facing * 1.25,
        y: player.y,
        facing: player.facing,
      }
      game.swap = null
    }
  }

  return !!game.swap
}
