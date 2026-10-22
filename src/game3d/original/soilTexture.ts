import { terrainTexture as settings } from '../../config/presentation.json'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { terrainNoise } from './terrainNoise'

export function createSoilTexture(palette: 'jungle' | 'mineCart' = 'jungle') {
  const size = settings.sizePixels
  const { brightness, variation } = settings[palette]
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2d context unavailable')
  }
  const data = ctx.createImageData(size, size)
  for (let coordY = 0; coordY < size; coordY++) {
    for (let coordX = 0; coordX < size; coordX++) {
      const pixelIdx = (coordY * size + coordX) * 4
      const value =
        brightness +
        terrainNoise(coordX + coordY * size) * variation +
        Math.sin(
          coordY * settings.layerFrequency +
            Math.sin(coordX * settings.grainFrequency) *
              settings.grainAmplitude,
        ) *
          settings.layerAmplitude
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
