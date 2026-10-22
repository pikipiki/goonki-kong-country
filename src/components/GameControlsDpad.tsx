import { useRef } from 'react'
import type { Game } from '../game/engine'
import type { Controls } from '../game/input'
import { GameDpadListeners } from './GameDpadListeners'

export function GameControlsDpad({
  game,
  controls,
  clickMode,
  direction,
  stick,
  setDirection,
  setStick,
  clear,
}: {
  game: Game
  controls: Controls
  clickMode: boolean
  direction: number
  stick: {
    x: number
    y: number
  }
  setDirection: (value: number) => void
  setStick: (value: { x: number; y: number }) => void
  clear: () => void
}) {
  const pad = useRef<HTMLDivElement>(null)
  const steer = (next: number, running = true) => {
    setDirection(next)
    controls.set('virtual-left', 'left', next < 0)
    controls.set('virtual-right', 'right', next > 0)
    controls.set('virtual-run', 'run', next !== 0 && running)
  }
  return (
    <GameDpadListeners
      game={game}
      controls={controls}
      clickMode={clickMode}
      direction={direction}
      stick={stick}
      padRef={pad}
      steer={steer}
      setStick={setStick}
      clear={clear}
    />
  )
}
