import { useEffect, type RefObject } from 'react'
import type { Game, Input } from '../game/engine'
import { mountScene2dLoop } from './scene2dLoopMount'

export function useScene2dLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  game: Game,
  input: Input,
  onTick: () => void,
) {
  useEffect(() => {
    return mountScene2dLoop(canvasRef, game, input, onTick)
  }, [canvasRef, game, input, onTick])
}
