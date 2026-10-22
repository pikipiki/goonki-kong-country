import { romMapLayout } from '../mapLayout'

export function resolveRomMapLayout(
  canvas: HTMLCanvasElement,
  pan: { x: number; y: number },
  follow: number[],
) {
  const rect = canvas.getBoundingClientRect()
  const canvasWidth = Math.max(256, Math.round(rect.width || window.innerWidth))
  const canvasHeight = Math.max(
    224,
    Math.round(rect.height || window.innerHeight),
  )
  const fullscreen = Boolean(canvas.closest('.phase-map'))
  const layout = romMapLayout(canvasWidth, canvasHeight, fullscreen, follow)
  const mapScale = layout.scale
  let offsetX
  if (fullscreen) {
    offsetX = Math.max(
      canvasWidth - 256 * mapScale,
      Math.min(0, layout.offsetX + pan.x),
    )
  } else {
    offsetX = layout.offsetX
  }
  let offsetY
  if (fullscreen) {
    offsetY = Math.max(
      canvasHeight - 224 * mapScale,
      Math.min(0, layout.offsetY + pan.y),
    )
  } else {
    offsetY = layout.offsetY
  }
  pan.x = offsetX - layout.offsetX
  pan.y = offsetY - layout.offsetY
  return {
    canvasWidth,
    canvasHeight,
    layout,
    mapScale,
    offsetX,
    offsetY,
  }
}
