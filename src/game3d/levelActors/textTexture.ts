import { CanvasTexture } from 'three'

export function textTexture(text: string, color: string, background?: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2d context unavailable')
  }
  if (background) {
    context.fillStyle = background
    context.roundRect(0, 0, 256, 128, 16)
    context.fill()
  }
  context.fillStyle = color
  context.font = '900 74px Georgia'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, 128, 65)
  return new CanvasTexture(canvas)
}
