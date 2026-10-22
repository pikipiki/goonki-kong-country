import type { Game } from '../../game/engine'
import type { Animal } from '../../game/animals'

export type GoonkFrameContext = {
  player: Game['player'] | undefined
  animTime: number
  cart: boolean
  mount: Animal | undefined
  swimming: boolean
  riding: boolean
  walking: number
  grounded: boolean
  pose: { x: number; y: number; facing: number } | undefined
}

export function buildGoonkFrameContext(
  game: Game | undefined,
  companion: boolean,
  preview: boolean,
  mapWalk: number,
  animTime: number,
): GoonkFrameContext {
  const player = game?.player

  const cart = Boolean(
    game &&
    (game.level.originalTerrain === 'mineCart' ||
      (game.level.biome === 'mine' && game.level.originalTerrain !== 'cave')),
  )

  let mount
  if (!companion && game) {
    mount = game.mount
  } else {
    mount = undefined
  }

  const swimming =
    !preview &&
    game?.level.biome === 'lagoon' &&
    (!mount || mount.kind === 'enguarde')

  const riding = Boolean(mount)

  let walking = mapWalk

  if (!preview) {
    if (cart || riding) {
      walking = 0
    } else {
      walking = Math.abs(player?.vx ?? 0)
    }
  }

  const grounded = player?.grounded ?? true

  let pose
  if (companion) {
    pose = game?.companion
  } else {
    pose = player
  }

  return {
    player,
    animTime,
    cart,
    mount,
    swimming,
    riding,
    walking,
    grounded,
    pose,
  }
}

export function goonkRootScale(
  pink: boolean,
  cart: boolean,
  riding: boolean,
  swimming: boolean,
): number {
  let base
  if (pink) {
    base = 2.2
  } else {
    base = 2.05
  }

  if (cart) {
    return base * 0.83
  }

  if (riding) {
    return base * 0.78
  }

  if (swimming) {
    return base * 0.85
  }

  return base
}
