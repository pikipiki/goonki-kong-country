import { useRef, type PointerEvent, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { Game } from '../game/engine'
import type { Controls } from '../game/input'
import { GameDirectionButtons } from './GameDirectionButtons'
import { GameDpadSurface } from './GameDpadSurface'
import { GameDpadStop } from './GameDpadStop'
import { GameSwimButtons } from './GameSwimButtons'
import { readStickMove } from './stickMove'
import { pick } from '../utils/pick'

function useDpadMove(
  game: Game,
  controls: Controls,
  clickMode: boolean,
  padRef: RefObject<HTMLDivElement | null>,
  pointer: RefObject<number | null>,
  steer: (next: number, running?: boolean) => void,
  setStick: (value: { x: number; y: number }) => void,
) {
  return (event: PointerEvent<HTMLDivElement>) => {
    const pad = padRef.current
    if (pointer.current !== event.pointerId || clickMode || !pad) {
      return
    }
    const motion = readStickMove(event, pad)
    setStick({ x: motion.stickX, y: motion.stickY })
    steer(
      pick(Math.abs(motion.offsetX) > 13, Math.sign(motion.offsetX), 0),
      Math.abs(motion.offsetX) > 32,
    )
    controls.set(
      'virtual-up',
      'up',
      game.level.biome === 'lagoon' && motion.offsetY < -22,
    )
    controls.set(
      'virtual-down',
      'down',
      game.level.biome === 'lagoon' && motion.offsetY > 22,
    )
  }
}

export function GameDpadListeners({
  game,
  controls,
  clickMode,
  direction,
  stick,
  padRef,
  steer,
  setStick,
  clear,
}: {
  game: Game
  controls: Controls
  clickMode: boolean
  direction: number
  stick: { x: number; y: number }
  padRef: RefObject<HTMLDivElement | null>
  steer: (next: number, running?: boolean) => void
  setStick: (value: { x: number; y: number }) => void
  clear: () => void
}) {
  const { t } = useTranslation()
  const pointer = useRef<number | null>(null)
  const move = useDpadMove(
    game,
    controls,
    clickMode,
    padRef,
    pointer,
    steer,
    setStick,
  )

  return (
    <div
      className="dpad"
      ref={padRef}
      role="group"
      aria-label={t('directionRun')}
      onPointerDown={(event) => {
        if (clickMode) {
          return
        }
        event.preventDefault()
        pointer.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        move(event)
      }}
      onPointerMove={move}
      onPointerUp={() => {
        pointer.current = null
        if (!clickMode) {
          clear()
        }
      }}
      onPointerCancel={() => {
        pointer.current = null
        clear()
      }}
      onLostPointerCapture={() => {
        pointer.current = null
        if (!clickMode) {
          clear()
        }
      }}
    >
      <GameDpadSurface stick={stick} />
      {game.level.biome === 'lagoon' && (
        <GameSwimButtons controls={controls} clickMode={clickMode} />
      )}
      <GameDirectionButtons
        clickMode={clickMode}
        direction={direction}
        steer={steer}
        clear={clear}
      />
      <GameDpadStop onStop={clear} />
    </div>
  )
}
