import { BOSS_CARRY } from '../game/bossArena'
import { SCENE2D_PIXELS_PER_WORLD } from './scene2dWorldUnits'
import type { BossProjectile } from '../game/bossBattle'
import { drawBossBarrel } from './bossScene2dPaintBarrels'
import type { BossPaintContext } from './bossScene2dPaintFrame'
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
  if (shot.impact > 0) {
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

export function paintBossPlush(paint: BossPaintContext) {
  const { ctx, game, plush, toCanvasX, toCanvasY, scale } = paint
  const player = game.player
  const plushScale = scale / SCENE2D_PIXELS_PER_WORLD
  const pose = (pink: boolean, facing: number, companion: boolean) => ({
    pink,
    facing,
    walking: Math.abs(player.vx),
    grounded: player.grounded,
    roll: !companion && player.roll > 0,
    rollAngle: player.rollAngle,
    rollFacing: player.rollFacing,
    cannonFlight: player.launched > 0,
    swapping: false,
    swapHop: 0,
    companion,
    riding: false,
    carrying: !companion && player.carry >= 0,
    celebrating: game.phase === 'clear' || game.phase === 'victory',
    time: game.time,
  })
  if (player.hp === 2) {
    plush.draw(
      ctx,
      toCanvasX(game.companion.x),
      toCanvasY(game.companion.y),
      pose(player.active !== 0, game.companion.facing, true),
      plushScale,
    )
  }
  if (!(player.invincible > 0 && Math.sin(game.time * 34) < -0.45)) {
    plush.draw(
      ctx,
      toCanvasX(player.x),
      toCanvasY(player.y),
      pose(player.active === 0, player.facing, false),
      plushScale,
    )
  }
  if (player.carry >= 0) {
    drawBossBarrel(
      ctx,
      paint.assets,
      game.level.barrels[player.carry]?.kind ?? 'throw',
      toCanvasX(player.x + player.facing * BOSS_CARRY.x),
      toCanvasY(player.y + BOSS_CARRY.y),
      'centre',
      game.time,
      scale,
    )
  }
}
