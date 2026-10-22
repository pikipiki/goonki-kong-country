import { ANIMAL_DESIGNS } from '../game/animals'
import { TEAM_SWAP_DURATION, type Game } from '../game/engine'
import { clamp } from '../game/engine/math'
import type { Assets2D } from './assets2d'
import { pick } from '../utils/pick'
import {
  drawRomHudBananas,
  drawRomHudKong,
  drawRomHudLives,
} from './drawRomHudParts'
import type { PlushSpriteRenderer } from './plushSprite'

export function drawChunkedLayer(
  ctx: CanvasRenderingContext2D,
  chunks: HTMLImageElement[],
  chunkW: number,
  camX: number,
  camY: number,
  screenW: number,
  screenH: number,
) {
  const viewLeft = Math.round(camX)

  const viewTop = Math.round(camY)

  const viewRight = viewLeft + screenW

  for (let index = 0; index < chunks.length; index++) {
    const img = chunks[index]

    const chunkLeft = index * chunkW

    const chunkRight = chunkLeft + img.width

    if (chunkRight <= viewLeft || chunkLeft >= viewRight) {
      continue
    }

    const overlapLeft = Math.max(viewLeft, chunkLeft)

    const overlapRight = Math.min(viewRight, chunkRight)

    const width = overlapRight - overlapLeft

    if (width <= 0) {
      continue
    }

    const srcX = overlapLeft - chunkLeft

    const srcY = clamp(viewTop, 0, Math.max(0, img.height - screenH))

    const destX = overlapLeft - viewLeft

    const height = Math.min(screenH, img.height - srcY)

    if (height <= 0) {
      continue
    }

    ctx.drawImage(img, srcX, srcY, width, height, destX, 0, width, height)
  }
}

function companionSwapPosition(
  game: Game,
  swapU: number,
  swapHop: number,
): { compX: number; compY: number } {
  const player = game.player

  const swap = game.swap

  if (!swap) {
    return { compX: game.companion.x, compY: game.companion.y }
  }

  const start = swap.back

  const behindX = player.x - player.facing * 1.25

  if (swapU < 0.5) {
    const blend = swapU * 2

    const ease = 0.5 - 0.5 * Math.cos(blend * Math.PI)

    return {
      compX: start.x + (player.x - start.x) * ease,
      compY: start.y + (player.y - start.y) * ease + swapHop * 0.55,
    }
  }

  const blend = (swapU - 0.5) * 2

  const ease = 0.5 - 0.5 * Math.cos(blend * Math.PI)

  return {
    compX: player.x + (behindX - player.x) * ease,
    compY: player.y + swapHop * 0.25 * (1 - blend),
  }
}

export function drawPlushCast(
  ctx: CanvasRenderingContext2D,
  game: Game,
  plushRenderer: PlushSpriteRenderer,
  toPixel: (worldX: number, worldY: number) => { px: number; py: number },
  camX: number,
  camY: number,
) {
  const player = game.player

  const swap = game.swap

  let swapU
  if (swap) {
    swapU = 1 - swap.remaining / TEAM_SWAP_DURATION
  } else {
    swapU = 0
  }

  const swapHop = Math.sin(Math.min(1, swapU) * Math.PI)

  const swapping = swapU > 0 && swapU < 1

  const celebrating = game.phase === 'clear' || game.phase === 'victory'

  if (player.hp === 2) {
    const { compX, compY } = companionSwapPosition(game, swapU, swapHop)

    const compPx = toPixel(compX, compY)

    plushRenderer.draw(ctx, compPx.px - camX, compPx.py - camY, {
      pink: player.active !== 0,
      facing: game.companion.facing,
      walking: Math.abs(player.vx),
      grounded: player.grounded,
      roll: false,
      rollAngle: 0,
      rollFacing: 1,
      cannonFlight: false,
      swapping,
      swapHop,
      companion: true,
      riding: false,
      carrying: false,
      celebrating,
      time: game.time,
    })
  }

  if (
    player.cannon < 0 &&
    !(player.invincible > 0 && Math.sin(game.time * 34) <= -0.45)
  ) {
    const mount = game.mount

    let actorX
    if (mount) {
      actorX = player.x - player.facing * 0.12
    } else {
      actorX = player.x
    }

    let actorY = player.y

    if (mount) {
      actorY = player.y + ANIMAL_DESIGNS[mount.kind].seat - 0.03
    } else if (swapping) {
      actorY = player.y + swapHop * 1.35
    }

    const actPx = toPixel(actorX, actorY)

    plushRenderer.draw(ctx, actPx.px - camX, actPx.py - camY, {
      pink: player.active === 0,
      facing: player.facing,
      walking: pick(mount, 0, Math.abs(player.vx)),
      grounded: player.grounded,
      roll: player.roll > 0,
      rollAngle: player.rollAngle,
      rollFacing: player.rollFacing,
      cannonFlight: player.launched > 0,
      swapping,
      swapHop,
      companion: false,
      riding: Boolean(mount),
      carrying: player.carry >= 0,
      celebrating,
      time: game.time,
    })
  }
}

export function drawRomHud(
  ctx: CanvasRenderingContext2D,
  assets: Assets2D,
  game: Game,
  screenW: number,
  isPortrait: boolean,
) {
  let hudY
  if (isPortrait) {
    hudY = 44
  } else {
    hudY = 22
  }

  const { kongStartX } = drawRomHudKong(
    ctx,
    assets,
    game,
    screenW,
    hudY,
    isPortrait,
  )

  drawRomHudBananas(ctx, assets, game, kongStartX, hudY, isPortrait)
  drawRomHudLives(ctx, assets, game, kongStartX, hudY)
}
