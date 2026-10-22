import { useTranslation } from 'react-i18next'
import { ANIMAL_DESIGNS } from '../game/animals'
import type { Game } from '../game/engine'
import type { Controls } from '../game/input'
import { GameControls } from '../components/GameControls'
import { localeKeys } from '../i18n/keys'
import { resolveI18nKey } from '../i18n/resolveText'
import { cssPercent } from '../utils/cssUnits'
import { Portrait } from './chrome'
import { PlayingHudBoss } from './PlayingHudBoss'
import { PlayingHudKeyboardHint } from './PlayingHudKeyboardHint'
import { PlayingHudLetters } from './PlayingHudLetters'
import { pick } from '../utils/pick'

export function PlayingHud({
  game,
  controls,
  demo2D,
  showControls,
}: {
  game: Game
  controls: Controls
  demo2D: boolean
  showControls: boolean
}) {
  const { t } = useTranslation()
  const progress = Math.min(100, (game.player.x / game.level.length) * 100)

  return (
    <>
      <div className="hud">
        <div className="team">
          <Portrait pink={game.player.active === 0} />
          <div>
            <strong>
              {resolveI18nKey(
                pick(
                  game.player.active,
                  localeKeys.buddies.violet,
                  localeKeys.buddies.rose,
                ),
              )}
              {game.mount &&
                ` · ${resolveI18nKey(ANIMAL_DESIGNS[game.mount.kind].name)}`}
            </strong>
            <div
              className="hearts"
              aria-label={t('charactersAvailable', { count: game.player.hp })}
            >
              <span>♥</span>
              <span className={pick(game.player.hp < 2, 'lost', '')}>♥</span>
              <small>× {game.lives}</small>
            </div>
          </div>
        </div>
        {!demo2D && (
          <div className="hud-stats">
            <div>
              <span className="banana-symbol">☽</span>
              <strong>{String(game.bananas).padStart(2, '0')}</strong>
              <small>/ 100</small>
            </div>
            <PlayingHudLetters game={game} />
          </div>
        )}
      </div>
      <div className="progress-track">
        <span style={{ width: cssPercent(progress) }} />
      </div>
      {game.toastTimer > 0 && (
        <div className="toast" role="status">
          <span>✦</span>
          {game.toast}
        </div>
      )}
      {game.levelId === 6 && <PlayingHudBoss game={game} />}
      <PlayingHudKeyboardHint />
      {showControls && <GameControls controls={controls} game={game} />}
    </>
  )
}
