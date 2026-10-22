import type { Assets2D } from './assets2d'

export function createScene2dDrawSprite(
  assets: Assets2D | null,
  camX: number,
  camY: number,
  screenW: number,
  screenH: number,
) {
  return (
    ctx: CanvasRenderingContext2D,
    frameIdx: number | undefined,
    pixelX: number,
    pixelY: number,
    flipX = false,
  ) => {
    if (!assets || frameIdx === undefined) {
      return
    }

    const frame = assets.manifest.frames[frameIdx]

    const screenX = Math.round(pixelX - camX)

    const screenY = Math.round(pixelY - camY)

    if (screenX + frame.w < -64 || screenX - frame.w > screenW + 64) {
      return
    }

    if (screenY + frame.h < -64 || screenY - frame.h > screenH + 64) {
      return
    }

    if (!flipX) {
      ctx.drawImage(
        assets.sprites,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        screenX + frame.ox,
        screenY + frame.oy,
        frame.w,
        frame.h,
      )
    } else {
      ctx.save()
      ctx.translate(screenX, screenY)
      ctx.scale(-1, 1)
      ctx.drawImage(
        assets.sprites,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        frame.ox,
        frame.oy,
        frame.w,
        frame.h,
      )
      ctx.restore()
    }
  }
}
