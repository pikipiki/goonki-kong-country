import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { worldRandom } from './worldPalettes'

export type WorldTextureKind = 'bark' | 'soil' | 'wood' | 'leaf'
const textures = new Map<WorldTextureKind, CanvasTexture>()
function sampleNoise(kind: WorldTextureKind, coordX: number, coordY: number) {
  const noise = worldRandom(coordX + coordY * 256) * 0.23
  let value = 0.6 + noise
  if (kind === 'bark') {
    value =
      0.48 +
      noise +
      Math.sin(coordX * 0.65 + Math.sin(coordY * 0.031) * 2) * 0.13 +
      Math.sin(coordX * 0.14) * 0.1
  }
  if (kind === 'wood') {
    value =
      0.55 +
      noise * 0.5 +
      Math.sin(coordY * 0.4 + Math.sin(coordX * 0.02) * 2) * 0.14
  }
  if (kind === 'soil') {
    value =
      0.44 +
      noise +
      worldRandom(Math.floor(coordX / 12) + Math.floor(coordY / 12) * 23) *
        0.1 +
      worldRandom(Math.floor(coordX / 3) + Math.floor(coordY / 3) * 67) * 0.06
  }
  if (kind === 'leaf') {
    value = 0.7 + noise * 0.25
  }
  return value
}
function paintLeafVeins(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#b4c18b70'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 128)
  ctx.lineTo(256, 128)
  ctx.stroke()
  ctx.lineWidth = 1
  for (let veinX = 12; veinX < 256; veinX += 15) {
    ctx.beginPath()
    ctx.moveTo(veinX, 128)
    ctx.quadraticCurveTo(veinX + 15, 95, veinX + 22, 0)
    ctx.moveTo(veinX, 128)
    ctx.quadraticCurveTo(veinX + 15, 161, veinX + 22, 256)
    ctx.stroke()
  }
}
function paintBarkSpots(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#7c88664a'
  for (let spotIdx = 0; spotIdx < 60; spotIdx++) {
    ctx.beginPath()
    ctx.ellipse(
      worldRandom(spotIdx) * 256,
      worldRandom(spotIdx + 9) * 256,
      3 + worldRandom(spotIdx + 3) * 8,
      worldRandom(spotIdx + 2) * 5,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
}
function paintWoodPlanks(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#241909'
  ctx.lineWidth = 3
  for (let plankY = 0; plankY < 256; plankY += 64) {
    ctx.beginPath()
    ctx.moveTo(0, plankY)
    ctx.lineTo(256, plankY)
    ctx.stroke()
  }
}
function textureRepeat(kind: WorldTextureKind): [number, number] {
  if (kind === 'leaf') {
    return [1, 1]
  }
  if (kind === 'bark') {
    return [2, 2]
  }
  return [3, 2]
}

export function worldProceduralTexture(kind: WorldTextureKind) {
  const cached = textures.get(kind)
  if (cached) {
    return cached
  }
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2d context unavailable')
  }
  const image = ctx.createImageData(256, 256)
  for (let coordY = 0; coordY < 256; coordY++) {
    for (let coordX = 0; coordX < 256; coordX++) {
      const pixelIdx = (coordY * 256 + coordX) * 4
      const value = sampleNoise(kind, coordX, coordY)
      const byte = Math.floor(value * 255)
      image.data[pixelIdx] = byte
      image.data[pixelIdx + 1] = byte
      image.data[pixelIdx + 2] = byte
      image.data[pixelIdx + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  if (kind === 'leaf') {
    paintLeafVeins(ctx)
  }
  if (kind === 'bark') {
    paintBarkSpots(ctx)
  }
  if (kind === 'wood') {
    paintWoodPlanks(ctx)
  }
  const map = new CanvasTexture(canvas)
  map.wrapS = map.wrapT = RepeatWrapping
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 2
  const [repeatX, repeatY] = textureRepeat(kind)
  map.repeat.set(repeatX, repeatY)
  textures.set(kind, map)
  return map
}
