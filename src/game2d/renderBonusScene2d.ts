import type { Game } from '../game/engine'
import type { Assets2D } from './assets2d'
import { drawPlushCast } from './drawRom2d'
import type { PlushSpriteRenderer } from './plushSprite'
import type { Scene2dSpriteDrawer } from './scene2dSpriteDraw'

type ToPixel = (
  worldX: number,
  worldY: number,
) => {
  px: number
  py: number
}

export function renderBonusScene2d(
  ctx: CanvasRenderingContext2D,
  game: Game,
  assets: Assets2D,
  camX: number,
  camY: number,
  screenW: number,
  screenH: number,
  plushRenderer: PlushSpriteRenderer,
  toPixel: ToPixel,
  drawer: Scene2dSpriteDrawer,
) {
  const { drawGroupAnim } = drawer
  ctx.fillStyle = '#080604'
  ctx.fillRect(0, 0, screenW, screenH)
  ctx.drawImage(assets.caveBack, -camX, -camY)
  // Bonus pickups
  game.level.pickups.forEach((item, pickupIdx) => {
    if (game.collected.has(pickupIdx)) {
      return
    }
    const { px, py } = toPixel(item.x, item.y)
    if (item.kind === 'balloon') {
      drawGroupAnim(ctx, 'balloon', game.time + pickupIdx * 0.2, 8, px, py)
    } else if (
      (
        item as {
          amount?: number
        }
      ).amount === 10
    ) {
      drawGroupAnim(
        ctx,
        'banana_bunch',
        game.time + pickupIdx * 0.1,
        10,
        px,
        py,
      )
    } else {
      drawGroupAnim(
        ctx,
        'banana_spin',
        game.time + pickupIdx * 0.15,
        12,
        px,
        py,
      )
    }
  })
  // Exit sign inside bonus room
  drawGroupAnim(ctx, 'sign_exit', game.time, 1, 212, 186)
  // Companion & Player plushies in 2D
  drawPlushCast(ctx, game, plushRenderer, toPixel, camX, camY)
  ctx.drawImage(assets.caveFront, -camX, -camY)
}
