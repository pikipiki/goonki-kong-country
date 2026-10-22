import { BOSS_BARREL_HEIGHT } from '../game/bossArena'
import type { BossAssets, BossFrame } from './bossScene2dAssets'
import { barrelObjectGroup } from './bossScene2dPhase'
import { bossObjectFrame } from './bossScene2dSprite'
import { pick } from '../utils/pick'

function drawObjectFrame(
  ctx: CanvasRenderingContext2D,
  assets: BossAssets,
  frame: BossFrame,
  anchorX: number,
  anchorY: number,
  drawScale: number,
) {
  ctx.drawImage(
    assets.objects,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    anchorX + frame.ox * drawScale,
    anchorY + frame.oy * drawScale,
    frame.w * drawScale,
    frame.h * drawScale,
  )
}

export function drawBossBarrel(
  ctx: CanvasRenderingContext2D,
  assets: BossAssets | null,
  kind: string,
  canvasX: number,
  canvasY: number,
  anchor: 'feet' | 'centre',
  time: number,
  scale: number,
) {
  const frame = bossObjectFrame(assets, barrelObjectGroup(kind), time)

  const drawScale = (BOSS_BARREL_HEIGHT * scale) / 40

  if (!frame || !assets) {
    ctx.fillStyle = '#9b622f'
    ctx.fillRect(
      canvasX - 0.4 * scale,
      canvasY - pick(anchor === 'feet', 1, 0.5) * BOSS_BARREL_HEIGHT * scale,
      0.8 * scale,
      BOSS_BARREL_HEIGHT * scale,
    )
    return
  }

  const anchorX = canvasX - (frame.ox + frame.w / 2) * drawScale

  const anchorY =
    canvasY - (frame.oy + frame.h * pick(anchor === 'feet', 1, 0.5)) * drawScale

  drawObjectFrame(ctx, assets, frame, anchorX, anchorY, drawScale)

  if (kind === 'rescue') {
    const letters = bossObjectFrame(assets, 'dk_letters', time)

    if (letters) {
      drawObjectFrame(ctx, assets, letters, anchorX, anchorY, drawScale)
    }
  }
}
