import { useTranslation } from 'react-i18next'
import type { Game } from '../game/engine'
import { controllerHint } from './gameControlCopy'

export function GameControlsToolbar({
  game,
  clickMode,
  onToggleMode,
}: {
  game: Game
  clickMode: boolean
  onToggleMode: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="controller-toolbar">
      <span className="controller-label">
        <i /> {controllerHint(game, clickMode, t)}
      </span>
      <button
        className="input-mode"
        aria-pressed={clickMode}
        onClick={onToggleMode}
      >
        {clickMode ? t('clickMode') : t('touchMode')} <span>⇄</span>
      </button>
    </div>
  )
}
