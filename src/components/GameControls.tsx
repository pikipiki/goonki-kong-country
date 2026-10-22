import { FINAL_BOSS_STAGE_ID } from '../game/stageCatalog'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type Game, type Key } from '../game/engine'
import { type Controls } from '../game/input'
import { GameControlsActions } from './GameControlsActions'
import { GameControlsCenter } from './GameControlsCenter'
import { GameControlsDpad } from './GameControlsDpad'
import { GameControlsToolbar } from './GameControlsToolbar'
function readClickMode(): boolean {
  try {
    return localStorage.getItem('goonk-input-mode') === 'click'
  } catch {
    return false
  }
}

export function GameControls({
  controls,
  game,
}: {
  controls: Controls
  game: Game
}) {
  const { t } = useTranslation()
  const [clickMode, setClickMode] = useState(readClickMode)
  const [direction, setDirection] = useState(0)
  const [stick, setStick] = useState({ x: 0, y: 0 })

  useEffect(() => {
    try {
      localStorage.setItem('goonk-input-mode', clickMode ? 'click' : 'touch')
    } catch {
      /* storage unavailable */
    }
    controls.setClickMode(clickMode)
  }, [clickMode, controls])

  const clear = useCallback(() => {
    for (const key of ['left', 'right', 'run', 'up', 'down'] as Key[]) {
      controls.set(`virtual-${key}`, key, false)
    }
    setDirection(0)
    setStick({ x: 0, y: 0 })
  }, [controls])

  useEffect(() => {
    const reset = () => {
      clear()
    }
    window.addEventListener('resize', reset)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('resize', reset)
      window.removeEventListener('blur', reset)
      clear()
    }
  }, [clear])

  const deckClass = [
    'controller-deck',
    game.levelId === FINAL_BOSS_STAGE_ID ? 'boss-controls' : '',
    clickMode ? 'click-mode' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={deckClass} aria-label={t('virtualController')}>
      <GameControlsToolbar
        game={game}
        clickMode={clickMode}
        onToggleMode={() => {
          clear()
          setClickMode(!clickMode)
        }}
      />
      <div className="controller-layout">
        <GameControlsDpad
          game={game}
          controls={controls}
          clickMode={clickMode}
          direction={direction}
          stick={stick}
          setDirection={setDirection}
          setStick={setStick}
          clear={clear}
        />
        <GameControlsCenter game={game} />
        <GameControlsActions
          game={game}
          controls={controls}
          clickMode={clickMode}
        />
      </div>
    </section>
  )
}
