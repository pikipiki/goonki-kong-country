import { useRef } from 'react'
import type { Game, Input } from '../game/engine'
import { useBossScene2dLoop } from './useBossScene2dLoop'
/** Shared gameplay clock and boss state; the pixel renderer never runs a separate fight. */
export function BossScene2D({
  game,
  input,
  onTick,
}: {
  game: Game
  input: Input
  onTick: () => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useBossScene2dLoop(ref, game, input, onTick)
  return (
    <canvas
      ref={ref}
      className="scene-2d-canvas"
      aria-label="Gangplank Galleon 2D"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  )
}
