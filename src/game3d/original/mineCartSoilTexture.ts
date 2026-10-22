import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { terrainNoise } from './terrainNoise'

export function createMineCartSoilTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2d context unavailable')
  }
  const data = ctx.createImageData(128, 128)
  for (let coordY = 0; coordY < 128; coordY++) {
    for (let coordX = 0; coordX < 128; coordX++) {
      const pixelIdx = (coordY * 128 + coordX) * 4
      const value =
        0.38 +
        terrainNoise(coordX + coordY * 128) * 0.28 +
        Math.sin(coordY * 0.17 + Math.sin(coordX * 0.07) * 1.3) * 0.065
      const byte = Math.round(value * 255)
      data.data[pixelIdx] = byte
      data.data[pixelIdx + 1] = byte
      data.data[pixelIdx + 2] = byte
      data.data[pixelIdx + 3] = 255
    }
  }
  ctx.putImageData(data, 0, 0)
  const map = new CanvasTexture(canvas)
  map.wrapS = map.wrapT = RepeatWrapping
  map.colorSpace = SRGBColorSpace
  return map
}
