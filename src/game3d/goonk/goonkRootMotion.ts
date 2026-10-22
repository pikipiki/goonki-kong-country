import type { Group } from 'three'
import { ANIMAL_DESIGNS } from '../../game/animals'
import type { Game } from '../../game/engine'
import type { GoonkFrameContext } from './goonkFrameContext'
import { goonkRootScale } from './goonkFrameContext'
import { applyGoonkSwapPosition } from './goonkSwapMotion'
import { pick } from '../../utils/pick'

export function goonkRootVisible(
  companion: boolean,
  player: Game['player'] | undefined,
  animTime: number,
): boolean {
  if (companion) {
    return (player?.hp ?? 2) === 2
  }

  if (!player) {
    return true
  }

  if (player.cannon >= 0) {
    return false
  }

  if (player.invincible > 0) {
    return Math.sin(animTime * 34) > -0.45
  }

  return true
}

export function applyGoonkRootTransform(
  root: Group,
  game: Game | undefined,
  companion: boolean,
  pink: boolean,
  frame: GoonkFrameContext,
  swapU: number,
  swapHop: number,
): void {
  const { player, cart, mount, swimming, riding, pose } = frame

  if (game?.swap && player && pose) {
    applyGoonkSwapPosition(root, game, companion, swapU, swapHop)
  } else if (pose) {
    root.position.set(pose.x, pose.y, pick(companion, -0.28, 0.3))
  }

  root.scale.setScalar(goonkRootScale(pink, cart, riding, swimming))

  if (mount && player) {
    root.position.set(
      player.x - player.facing * 0.12,
      player.y + ANIMAL_DESIGNS[mount.kind].seat - 0.03,
      0.2,
    )
  }

  if (cart && player) {
    root.position.set(
      player.x + pick(companion, -0.5, 0.4),
      player.y + 0.92,
      pick(companion, -0.2, 0.3),
    )
  }

  root.visible = goonkRootVisible(companion, player, frame.animTime)
}
