import { plushAnimationGroup } from './plushAtlasPose'
import { drawPlushFallback2D } from './plushFallbackDraw'
import { pick } from '../utils/pick'

export interface PlushPoseState {
  pink: boolean
  facing: number
  walking: number
  grounded: boolean
  roll: boolean
  rollAngle: number
  rollFacing: number
  cannonFlight: boolean
  swapping: boolean
  swapHop: number
  companion: boolean
  riding: boolean
  carrying: boolean
  celebrating?: boolean
  time: number
}

export interface PlushFrameMeta {
  x: number
  y: number
  w: number
  h: number
  ox: number
  oy: number
}

export interface PlushAtlasManifest {
  frames: PlushFrameMeta[]
  groups: Record<string, number[]>
}

export interface LoadedPlushAtlas {
  image: HTMLImageElement
  manifest: PlushAtlasManifest
}

let cachedPlushAtlasPromise: Promise<LoadedPlushAtlas | null> | null = null

function assetUrl(path: string): string {
  let base
  if (typeof import.meta !== 'undefined' && import.meta.env.BASE_URL) {
    base = import.meta.env.BASE_URL
  } else {
    base = '/'
  }

  return `${base.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`
}

export function loadPlushAtlas(): Promise<LoadedPlushAtlas | null> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null)
  }

  if (!cachedPlushAtlasPromise) {
    cachedPlushAtlasPromise = Promise.all([
      fetch(assetUrl('rom2d/plush.json')).then((response) => {
        if (!response.ok) {
          throw new Error('Missing plush.json')
        }

        return response.json() as Promise<PlushAtlasManifest>
      }),
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()

        img.onload = () => {
          resolve(img)
        }

        img.onerror = reject
        img.src = assetUrl('rom2d/plush.png')
      }),
    ])
      .then(([manifest, image]) => ({ manifest, image }))
      .catch(() => null)
  }

  return cachedPlushAtlasPromise
}

export class PlushSpriteRenderer {
  private atlas: LoadedPlushAtlas | null = null

  setAtlas(loaded: LoadedPlushAtlas | null) {
    this.atlas = loaded
  }

  draw(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    state: PlushPoseState,
    scale = 1,
  ) {
    if (state.grounded && !state.riding && !state.cannonFlight) {
      ctx.save()
      ctx.fillStyle = 'rgba(8, 12, 6, 0.38)'
      ctx.beginPath()
      const shadowRx = pick(state.pink, 11, 10) * scale

      const shadowRy = 3.2 * scale

      ctx.ellipse(
        Math.round(screenX),
        Math.round(screenY + 2 * scale),
        shadowRx,
        shadowRy,
        0,
        0,
        Math.PI * 2,
      )
      ctx.fill()
      ctx.restore()
    }

    if (this.atlas) {
      this.drawFromAtlas(ctx, screenX, screenY, state, scale)
      return
    }

    drawPlushFallback2D(ctx, screenX, screenY, state, scale)
  }

  private drawFromAtlas(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    state: PlushPoseState,
    scale: number,
  ) {
    const atlas = this.atlas

    if (!atlas) {
      return
    }

    const { image, manifest } = atlas

    const { groupName, frameIdxInGroup } = plushAnimationGroup(manifest, state)

    const group = manifest.groups[groupName] ?? []

    if (group.length === 0) {
      drawPlushFallback2D(ctx, screenX, screenY, state, scale)
      return
    }

    const frameIndex = group[frameIdxInGroup % group.length]

    const frame = manifest.frames.at(frameIndex)

    if (frame === undefined) {
      drawPlushFallback2D(ctx, screenX, screenY, state, scale)
      return
    }

    const destX = Math.round(screenX)

    const destY = Math.round(screenY)

    const flipX = state.facing < 0

    const drawW = Math.round(frame.w * scale)

    const drawH = Math.round(frame.h * scale)

    const offsetX = Math.round(frame.ox * scale)

    const offsetY = Math.round(frame.oy * scale)

    ctx.save()
    ctx.translate(destX, destY)

    if (flipX) {
      ctx.scale(-1, 1)
    }

    ctx.drawImage(
      image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      offsetX,
      offsetY,
      drawW,
      drawH,
    )
    ctx.restore()
  }

  dispose() {
    // Pure 2D atlas renderer holds no WebGL context
  }
}
