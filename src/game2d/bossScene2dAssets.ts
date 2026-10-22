export interface BossFrame {
  x: number
  y: number
  w: number
  h: number
  ox: number
  oy: number
}

export interface BossAssets {
  image: HTMLImageElement
  manifest: {
    frames: BossFrame[]
    groups: Record<string, number[]>
  }
  background: HTMLImageElement | null
  objects: HTMLImageElement
  objectManifest: {
    frames: BossFrame[]
    groups: Record<string, number[]>
  }
}
function bossAssetUrl(path: string) {
  return `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}rom2d/${path}`
}
function loadBossImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve(img)
    }
    img.onerror = reject
    img.src = bossAssetUrl(src)
  })
}
let assetsPromise: Promise<BossAssets> | null = null
export function loadBossScene2dAssets(): Promise<BossAssets> {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      loadBossImage('boss-sprites.png'),
      fetch(bossAssetUrl('boss.json')).then((response) => {
        if (!response.ok) {
          throw new Error('Missing boss atlas')
        }
        return response.json() as Promise<BossAssets['manifest']>
      }),
      loadBossImage('boss-background.png').catch(() => null),
      loadBossImage('sprites.png'),
      fetch(bossAssetUrl('manifest.json')).then((response) => {
        if (!response.ok) {
          throw new Error('Missing object atlas')
        }
        return response.json() as Promise<BossAssets['objectManifest']>
      }),
    ])
      .then(([image, manifest, background, objects, objectManifest]) => ({
        image,
        manifest,
        background,
        objects,
        objectManifest,
      }))
      .catch((err: unknown) => {
        assetsPromise = null
        throw err
      })
  }
  return assetsPromise
}
