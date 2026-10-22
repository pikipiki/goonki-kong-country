import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { themeColors } from '../theme'
import { terrainNoise } from './terrainNoise'

const coralNoise = themeColors.scene.coralReef.textureNoiseRgb
const CORAL_TEXTURE_SIZE_PX = 128
const CORAL_TEXTURE_NOISE_BASE = 0.42
const CORAL_TEXTURE_NOISE_SPAN = 0.35
const CORAL_TEXTURE_ALPHA_OPAQUE = 255

export function createCoralReefTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = CORAL_TEXTURE_SIZE_PX
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2d context unavailable')
  }
  const data = ctx.createImageData(CORAL_TEXTURE_SIZE_PX, CORAL_TEXTURE_SIZE_PX)
  for (let coordY = 0; coordY < CORAL_TEXTURE_SIZE_PX; coordY++) {
    for (let coordX = 0; coordX < CORAL_TEXTURE_SIZE_PX; coordX++) {
      const pixelIdx = (coordY * CORAL_TEXTURE_SIZE_PX + coordX) * 4
      const value =
        CORAL_TEXTURE_NOISE_BASE +
        terrainNoise(coordX + coordY * CORAL_TEXTURE_SIZE_PX) *
          CORAL_TEXTURE_NOISE_SPAN
      data.data[pixelIdx] = Math.round(value * coralNoise.red)
      data.data[pixelIdx + 1] = Math.round(value * coralNoise.green)
      data.data[pixelIdx + 2] = Math.round(value * coralNoise.blue)
      data.data[pixelIdx + 3] = CORAL_TEXTURE_ALPHA_OPAQUE
    }
  }
  ctx.putImageData(data, 0, 0)
  const map = new CanvasTexture(canvas)
  map.wrapS = map.wrapT = RepeatWrapping
  map.colorSpace = SRGBColorSpace
  return map
}
