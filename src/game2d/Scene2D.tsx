import { useRef } from 'react'
import { type Game, type Input } from '../game/engine'
import { useScene2dLoop } from './useScene2dLoop'
export function Scene2D({
  game,
  input,
  onTick,
}: {
  game: Game
  input: Input
  onTick: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useScene2dLoop(canvasRef, game, input, onTick)
  return (
    <canvas
      ref={canvasRef}
      className="scene-2d-canvas"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  )
}
