import type { BossProjectile } from '../game/bossBattle'
import type { BossPaintContext } from './bossScene2dPaintTypes'
import { createBossAtlasDrawer } from './bossScene2dSprite'
function paintCrownShot(
  paint: BossPaintContext,
  drawAtlas: ReturnType<typeof createBossAtlasDrawer>,
  screenX: number,
  screenY: number,
  shotHeight: number,
) {
  const { ctx, game, scale } = paint
  if (
    drawAtlas(
      'crown',
      game.time,
      screenX,
      screenY,
      ctx,
      false,
      Math.max(8, shotHeight * scale),
      true,
      undefined,
      true,
    )
  ) {
    return
  }
  ctx.fillStyle = '#efc342'
  ctx.fillRect(screenX - 5, screenY - 4, 10, 7)
}
function paintCannonShot(
  paint: BossPaintContext,
  drawAtlas: ReturnType<typeof createBossAtlasDrawer>,
  screenX: number,
  screenY: number,
  shot: BossProjectile,
) {
  const { ctx, scale } = paint
  ctx.save()
  ctx.translate(screenX, screenY)
  if ((shot.impact ?? 0) > 0) {
    ctx.scale(1.25, 0.65)
  }
  if (
    drawAtlas(
      'cannonball',
      0,
      0,
      0,
      ctx,
      false,
      shot.height * scale,
      true,
      undefined,
      true,
    )
  ) {
    ctx.restore()
    return
  }
  ctx.fillStyle = '#252326'
  ctx.beginPath()
  ctx.arc(0, 0, shot.width * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function paintBossProjectiles(paint: BossPaintContext) {
  const { ctx, toCanvasX, toCanvasY, floor, bossProjectiles } = paint
  const drawAtlas = createBossAtlasDrawer(paint.assets)
  for (const shot of bossProjectiles ?? []) {
    if (!shot.active) {
      continue
    }
    if (shot.kind === 'cannonball' && shot.warning > 0) {
      ctx.fillStyle = 'rgba(255,205,90,.72)'
      ctx.fillRect(toCanvasX(shot.x) - 4, floor - 2, 8, 2)
      continue
    }
    const screenX = toCanvasX(shot.x)
    const screenY = toCanvasY(shot.y)
    if (shot.kind === 'crown') {
      paintCrownShot(paint, drawAtlas, screenX, screenY, shot.height)
    } else {
      paintCannonShot(paint, drawAtlas, screenX, screenY, shot)
    }
  }
}
