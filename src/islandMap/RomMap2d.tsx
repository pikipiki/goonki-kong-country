import { useEffect, useRef } from 'react'
import type { MapProps } from './types'
import { useRomMap2dLoop } from './useRomMap2dLoop'

export function RomMap2d({
  selected,
  unlocked,
  initial,
  onSelect,
  onProject,
  onSound,
}: Omit<MapProps, 'onConfirm'> & {
  onProject: (
    points: {
      x: number
      y: number
    }[],
  ) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const refs = useRef({
    selected,
    unlocked,
    onSelect,
    onProject,
    onSound,
  })
  useEffect(() => {
    refs.current = {
      selected,
      unlocked,
      onSelect,
      onProject,
      onSound,
    }
  }, [selected, unlocked, onSelect, onProject, onSound])
  const pointer = useRomMap2dLoop(canvasRef, initial, refs)
  return (
    <canvas
      ref={canvasRef}
      className="island-map-2d-canvas"
      onPointerDown={pointer.onPointerDown}
      onPointerMove={pointer.onPointerMove}
      onPointerUp={pointer.onPointerUp}
      onPointerCancel={pointer.onPointerCancel}
      onClick={pointer.onCanvasClick}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        imageRendering: 'pixelated',
        touchAction: 'none',
      }}
    />
  )
}
