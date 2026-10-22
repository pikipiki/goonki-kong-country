export interface SpriteFrame {
  x: number
  y: number
  w: number
  h: number
  ox: number
  oy: number
}

export interface Manifest2D {
  skyDay: [number, number, number][]
  skyNight: [number, number, number][]
  layer1ChunkWidth?: number
  frames: SpriteFrame[]
  groups: Record<string, number[]>
}

export interface Assets2D {
  manifest: Manifest2D
  sprites: HTMLImageElement
  l1BackChunks: HTMLImageElement[]
  l1FrontChunks: HTMLImageElement[]
  l2: HTMLImageElement
  l3: HTMLImageElement
  caveBack: HTMLImageElement
  caveFront: HTMLImageElement
}

function assetUrl(path: string): string {
  let base
  if (typeof import.meta !== 'undefined' && import.meta.env.BASE_URL) {
    base = import.meta.env.BASE_URL
  } else {
    base = '/'
  }

  return `${base.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve(img)
    }

    img.onerror = () => {
      reject(new Error(`Failed to load ${src}`))
    }

    img.src = assetUrl(src)
  })
}

let cachedAssetsPromise: Promise<Assets2D> | null = null

export function loadAssets2D(): Promise<Assets2D> {
  if (!cachedAssetsPromise) {
    cachedAssetsPromise = Promise.all([
      fetch(assetUrl('rom2d/manifest.json')).then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load rom2d/manifest.json')
        }

        return response.json() as Promise<Manifest2D>
      }),
      loadImage('rom2d/sprites.png'),
      loadImage('rom2d/layer1-back-0.png'),
      loadImage('rom2d/layer1-back-1.png'),
      loadImage('rom2d/layer1-back-2.png'),
      loadImage('rom2d/layer1-front-0.png'),
      loadImage('rom2d/layer1-front-1.png'),
      loadImage('rom2d/layer1-front-2.png'),
      loadImage('rom2d/layer2.png'),
      loadImage('rom2d/layer3.png'),
      loadImage('rom2d/bonus-cave-back.png'),
      loadImage('rom2d/bonus-cave-front.png'),
    ])
      .then(
        ([
          manifest,
          sprites,
          l1Back0,
          l1Back1,
          l1Back2,
          l1Front0,
          l1Front1,
          l1Front2,
          layer2Image,
          layer3Image,
          caveBack,
          caveFront,
        ]) => ({
          manifest,
          sprites,
          l1BackChunks: [l1Back0, l1Back1, l1Back2],
          l1FrontChunks: [l1Front0, l1Front1, l1Front2],
          l2: layer2Image,
          l3: layer3Image,
          caveBack,
          caveFront,
        }),
      )
      .catch((err: unknown) => {
        cachedAssetsPromise = null
        throw err
      })
  }

  return cachedAssetsPromise
}
