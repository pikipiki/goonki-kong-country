import { useCallback, useRef, type PointerEvent, type RefObject } from 'react'
import { romMapLayout } from '../mapLayout'
import { pickRomMapNode } from './romMap2dHitTest'
import type { RomMap2dRefs } from './romMap2dRefs'
import { useRomMap2dAnimation } from './useRomMap2dAnimation'
import { useRomMap2dPanHandlers } from './useRomMap2dPanHandlers'

export function useRomMap2dLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  initial: number,
  refs: RefObject<RomMap2dRefs>,
) {
  const viewRef = useRef<ReturnType<typeof romMapLayout> | null>(null)
  const panRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)

  useRomMap2dAnimation(canvasRef, initial, refs, panRef, viewRef)
  const { onPointerDown, onPointerMove } = useRomMap2dPanHandlers(
    panRef,
    dragRef,
  )

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (dragRef.current) {
        dragRef.current.pointerId = -1
      }
      event.currentTarget.releasePointerCapture(event.pointerId)
    },
    [dragRef],
  )

  const onCanvasClick = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas || dragRef.current?.moved) {
        dragRef.current = null
        return
      }
      dragRef.current = null
      const rect = canvas.getBoundingClientRect()
      const layout = viewRef.current ?? romMapLayout(rect.width, rect.height)
      const picked = pickRomMapNode(
        event.clientX - rect.left,
        event.clientY - rect.top,
        layout,
        refs.current.unlocked,
      )
      if (picked !== null) {
        refs.current.onSelect(picked)
      }
    },
    [canvasRef, dragRef, refs, viewRef],
  )

  const onPointerCancel = useCallback(() => {
    dragRef.current = null
  }, [dragRef])

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onCanvasClick,
    onPointerCancel,
  }
}
