export function resizeRomCanvas(
  canvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  lastSize: {
    width: number
    height: number
  },
) {
  if (canvasWidth === lastSize.width && canvasHeight === lastSize.height) {
    return false
  }
  lastSize.width = canvasWidth
  lastSize.height = canvasHeight
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  return true
}
