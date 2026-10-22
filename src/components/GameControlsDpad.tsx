import { useRef, type RefObject } from 'react'
import { type Game, type Key } from '../game/engine'
import { type Controls } from '../game/input'
import { useTranslation } from 'react-i18next'
import { controlFeedback } from './controlFeedback'
import { cssPx } from '../utils/cssUnits'
import { useDpadMove } from './stickMove'
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

export function GameDirectionButtons({
  clickMode,
  direction,
  steer,
  clear,
}: {
  clickMode: boolean
  direction: number
  steer: (next: number, running?: boolean) => void
  clear: () => void
}) {
  const { t } = useTranslation()

  const directionButton = (next: number) => (
    <button
      className={`direction-button ${next < 0 ? 'left' : 'right'} ${direction === next ? 'is-down' : ''}`}
      aria-label={next < 0 ? t('goLeft') : t('goRight')}
      aria-pressed={direction === next}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        steer(clickMode && direction === next ? 0 : next)
        controlFeedback()
      }}
      onPointerUp={() => {
        if (!clickMode) {
          clear()
        }
      }}
      onPointerCancel={clear}
      onLostPointerCapture={() => {
        if (!clickMode) {
          clear()
        }
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          steer(direction === next ? 0 : next)
        }
      }}
    >
      <span aria-hidden="true">{next < 0 ? '◀' : '▶'}</span>
    </button>
  )

  return (
    <>
      {directionButton(-1)}
      {directionButton(1)}
    </>
  )
}

export function GameSwimButtons({
  controls,
  clickMode,
}: {
  controls: Controls
  clickMode: boolean
}) {
  const { t } = useTranslation()

  const swimButton = (key: Key) => (
    <button
      key={key}
      className={`swim-direction swim-${key}`}
      aria-label={key === 'up' ? t('swimUp') : t('swimDown')}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        const held = controls.input.held.has(key)
        controls.set(
          `virtual-${key === 'up' ? 'down' : 'up'}`,
          key === 'up' ? 'down' : 'up',
          false,
        )
        controls.set(`virtual-${key}`, key, clickMode ? !held : true)
      }}
      onPointerUp={() => {
        if (!clickMode) {
          controls.set(`virtual-${key}`, key, false)
        }
      }}
      onLostPointerCapture={() => {
        if (!clickMode) {
          controls.set(`virtual-${key}`, key, false)
        }
      }}
      onPointerCancel={() => {
        controls.set(`virtual-${key}`, key, false)
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          controls.set(`virtual-${key}`, key, !controls.input.held.has(key))
        }
      }}
    >
      {key === 'up' ? '▲' : '▼'}
    </button>
  )

  return (
    <>
      {swimButton('up')}
      {swimButton('down')}
    </>
  )
}

export function GameDpadSurface({
  stick,
}: {
  stick: {
    x: number
    y: number
  }
}) {
  return (
    <>
      <span className="dpad-ring" />
      <span
        className="stick"
        style={{
          transform: `translate(${cssPx(stick.x)},${cssPx(stick.y)})`,
        }}
        aria-hidden="true"
      />
    </>
  )
}

export function GameDpadStop({ onStop }: { onStop: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <button
        className="stop-button"
        aria-label={t('stopMove')}
        onPointerDown={(event) => {
          event.stopPropagation()
          onStop()
        }}
      >
        ■
      </button>
      <span className="direction-caption">{t('directionRun')}</span>
    </>
  )
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
