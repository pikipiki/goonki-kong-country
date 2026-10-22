import { useTranslation } from 'react-i18next'
import type { Game } from '../game/engine'
import { pick } from '../utils/pick'

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
          <i key={index} className={pick(index < bossHp, 'alive', '')} />
        ))}
      </div>
    </div>
  )
}
