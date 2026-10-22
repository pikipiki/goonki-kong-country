import type { PointerEvent } from 'react'

export function readStickMove(
  event: PointerEvent<HTMLDivElement>,
  pad: HTMLDivElement,
) {
  const rect = pad.getBoundingClientRect()
  const offsetX = event.clientX - rect.left - rect.width / 2
  const offsetY = event.clientY - rect.top - rect.height / 2
  const distance = Math.hypot(offsetX, offsetY)
  const factor = Math.min(1, 38 / Math.max(1, distance))
  return {
    offsetX,
    offsetY,
    stickX: offsetX * factor,
    stickY: offsetY * factor,
  }
}
