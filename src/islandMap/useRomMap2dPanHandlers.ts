import { useCallback, type PointerEvent, type RefObject } from 'react'

export function useRomMap2dPanHandlers(
  panRef: RefObject<{ x: number; y: number }>,
  dragRef: RefObject<{
    pointerId: number
    startX: number
    startY: number
    moved: boolean
  } | null>,
) {
  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      }
    },
    [dragRef],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const dragState = dragRef.current
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return
      }
      const deltaX = event.clientX - dragState.startX
      const deltaY = event.clientY - dragState.startY
      if (Math.hypot(deltaX, deltaY) > 4) {
        dragState.moved = true
      }
      if (dragState.moved) {
        panRef.current.x += deltaX
        panRef.current.y += deltaY
        dragState.startX = event.clientX
        dragState.startY = event.clientY
      }
    },
    [dragRef, panRef],
  )

  return { onPointerDown, onPointerMove }
}
