import { useTranslation } from 'react-i18next'
import type { Game, Phase } from '../game/engine'
import { Icon } from './chrome'
import { pick } from '../utils/pick'
import {
  panelDescriptionKey,
  panelEyebrowText,
  panelFlowerGlyph,
  panelPrimaryKey,
  panelTitleKey,
} from './phasePanelCopy'

export function PhasePanel({
  phase,
  game,
  onPrimary,
  onOpenMap,
}: {
  phase: Phase
  game: Game
  onPrimary: () => void
  onOpenMap: () => void
}) {
  const { t } = useTranslation()
  if (
    phase !== 'paused' &&
    phase !== 'clear' &&
    phase !== 'gameover' &&
    phase !== 'victory'
  ) {
    return null
  }
  const levelLabel = String(game.levelId + 1).padStart(2, '0')
  return (
    <div className={`overlay ${pick(phase === 'clear', 'clear-overlay', '')}`}>
      <main className={`panel ${pick(phase === 'clear', 'clear-panel', '')}`}>
        <span className="panel-flower">{panelFlowerGlyph(phase)}</span>
        <p className="eyebrow">{panelEyebrowText(phase, t, levelLabel)}</p>
        <h2>{t(panelTitleKey(phase))}</h2>
        <p className="panel-description">{t(panelDescriptionKey(phase))}</p>
        {phase !== 'paused' && (
          <div className="results">
            <div>
              <strong>{game.levelBananas}</strong>
              <span>{t('statBananas')}</span>
            </div>
            <div>
              <strong>
                {game.letters.size}
                <small>/{game.letterWord.length}</small>
              </strong>
              <span>{t('statLetters')}</span>
            </div>
            <div>
              <strong>
                {Math.floor(game.time)}
                <small>s</small>
              </strong>
              <span>{t('statTime')}</span>
            </div>
          </div>
        )}
        <button className="primary" onClick={onPrimary}>
          {t(panelPrimaryKey(phase))}
          <Icon name="arrow" />
        </button>
        <button className="secondary panel-secondary" onClick={onOpenMap}>
          {t('map')}
        </button>
      </main>
    </div>
  )
}
