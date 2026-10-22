import type { Assets2D } from './assets2d'
import { createScene2dDrawSprite } from './scene2dDrawSprite'

export type Scene2dSpriteDrawer = {
  drawSprite: (
    ctx: CanvasRenderingContext2D,
    frameIdx: number | undefined,
    px: number,
    py: number,
    flipX?: boolean,
  ) => void
  drawGroupAnim: (
    ctx: CanvasRenderingContext2D,
    groupName: string,
    animTime: number,
    fps: number,
    px: number,
    py: number,
    flipX?: boolean,
    loop?: boolean,
  ) => void
}

export function createScene2dSpriteDrawer(
  assets: Assets2D | null,
  camX: number,
  camY: number,
  screenW: number,
  screenH: number,
): Scene2dSpriteDrawer {
  const drawSprite = createScene2dDrawSprite(
    assets,
    camX,
    camY,
    screenW,
    screenH,
  )

  const drawGroupAnim = (
    ctx: CanvasRenderingContext2D,
    groupName: string,
    animTime: number,
    fps: number,
    pixelX: number,
    pixelY: number,
    flipX = false,
    loop = true,
  ) => {
    if (!assets) {
      return
    }

    const group = assets.manifest.groups[groupName]

    if (!group.length) {
      return
    }

    const rawIdx = Math.floor(Math.max(0, animTime) * fps)

    let idx
    if (loop) {
      idx = rawIdx % group.length
    } else {
      idx = Math.min(group.length - 1, rawIdx)
    }

    drawSprite(ctx, group[idx], pixelX, pixelY, flipX)
  }

  return { drawSprite, drawGroupAnim }
}
