import { FINAL_BOSS_STAGE_ID } from '../game/stageCatalog'
import { useTranslation } from 'react-i18next'
import { ANIMAL_DESIGNS } from '../game/animals'
import { type Game } from '../game/engine'
import { type Controls } from '../game/input'
import { GameControls } from './GameControls'
import { localeKeys } from '../i18n/keys'
import { resolveI18nKey } from '../i18n/resolveText'
import { cssPercent } from '../utils/cssUnits'
import { Portrait } from './chrome'
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
                game.player.active
                  ? localeKeys.buddies.violet
                  : localeKeys.buddies.rose,
              )}
              {game.mount &&
                ` · ${resolveI18nKey(ANIMAL_DESIGNS[game.mount.kind].name)}`}
            </strong>
            <div
              className="hearts"
              aria-label={t('charactersAvailable', { count: game.player.hp })}
            >
              <span>♥</span>
              <span className={game.player.hp < 2 ? 'lost' : ''}>♥</span>
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
      {game.levelId === FINAL_BOSS_STAGE_ID && <PlayingHudBoss game={game} />}
      <PlayingHudKeyboardHint />
      {showControls && <GameControls controls={controls} game={game} />}
    </>
  )
}

export function PlayingHudBoss({ game }: { game: Game }) {
  const { t } = useTranslation()
  const bossHits = game.bossBattle?.maxHits ?? 10
  const bossHp = game.enemies.find((enemy) => enemy.kind === 'boss')?.hp ?? 0

  return (
    <div
      className="boss-health"
      role="progressbar"
      aria-label={t('bossName')}
      aria-valuemin={0}
      aria-valuemax={bossHits}
      aria-valuenow={bossHp}
    >
      <span>{t('bossName')}</span>
      <div>
        {Array.from({ length: bossHits }, (_, index) => (
          <i key={index} className={index < bossHp ? 'alive' : ''} />
        ))}
      </div>
    </div>
  )
}

export function PlayingHudKeyboardHint() {
  const { t } = useTranslation()
  return (
    <div className="keyboard-hint">
      <span>
        <kbd>←</kbd>
        <kbd>→</kbd> {t('hintMove')}
      </span>
      <span>
        <kbd>Space</kbd> {t('hintJump')}
      </span>
      <span>
        <kbd>X</kbd> {t('hintRoll')}
      </span>
      <span>
        <kbd>C</kbd> {t('hintSwap')}
      </span>
      <span>
        <kbd>⇧</kbd> {t('hintRun')}
      </span>
    </div>
  )
}

function letterFound(game: Game, letter: string, index: number): boolean {
  return [...game.letters].some((pickupIndex) => {
    const pickup = game.level.pickups[pickupIndex]
    if (pickup.letter !== letter) {
      return false
    }
    const letterPickups = game.level.pickups.filter(
      (entry) => entry.kind === 'letter',
    )
    const letterIndex = letterPickups.findIndex(
      (entry) => entry === game.level.pickups[pickupIndex],
    )
    return letterIndex === index
  })
}

export function PlayingHudLetters({ game }: { game: Game }) {
  return (
    <div className="letter-track">
      {game.letterWord.split('').map((letter, index) => (
        <span
          key={index}
          className={letterFound(game, letter, index) ? 'found' : ''}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}
