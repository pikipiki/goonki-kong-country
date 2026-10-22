import type { BossAssets, BossFrame } from './bossScene2dAssets'

export function createBossAtlasDrawer(assets: BossAssets | null) {
  return (
    group: string,
    time: number,
    canvasX: number,
    canvasY: number,
    ctx: CanvasRenderingContext2D,
    flip = false,
    desiredHeight?: number,
    loop = true,
    fixedScale?: number,
    centered = false,
  ) => {
    if (!assets) {
      return false
    }

    const list = assets.manifest.groups[group] ?? []

    if (list.length === 0) {
      return false
    }

    const frameIndex = Math.floor(Math.max(0, time) * 12)

    const frameIdx =
      list[
        loop ? frameIndex % list.length : Math.min(frameIndex, list.length - 1)
      ]

    const frame = assets.manifest.frames.at(frameIdx)

    if (frame === undefined) {
      return false
    }

    const drawScale =
      fixedScale ?? (desiredHeight === undefined ? 1 : desiredHeight / frame.h)

    ctx.save()
    ctx.translate(Math.round(canvasX), Math.round(canvasY))

    if (flip) {
      ctx.scale(-1, 1)
    }

    let offsetY = frame.oy

    if (centered) {
      offsetY = -frame.h / 2
    } else if (group === 'fall' || group === 'getUp') {
      offsetY = -frame.h
    }

    ctx.drawImage(
      assets.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      Math.round((centered ? -frame.w / 2 : frame.ox) * drawScale),
      Math.round(offsetY * drawScale),
      Math.ceil(frame.w * drawScale),
      Math.ceil(frame.h * drawScale),
    )
    ctx.restore()
    return true
  }
}

export function bossObjectFrame(
  assets: BossAssets | null,
  group: string,
  time: number,
): BossFrame | undefined {
  const list = assets?.objectManifest.groups[group]

  if (!list?.length || !assets) {
    return undefined
  }

  const frameId = list[Math.floor(Math.max(0, time) * 12) % list.length]
  return assets.objectManifest.frames.at(frameId)
}
