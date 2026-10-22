import { useTranslation } from 'react-i18next'
import { ANIMAL_DESIGNS } from '../game/animals'
import type { Game } from '../game/engine'
import { resolveI18nKey } from '../i18n/resolveText'

export function GameControlsCenter({ game }: { game: Game }) {
  const { t } = useTranslation()
  const mount = game.mount
  return (
    <div className="controller-center">
      <span className="controller-emblem">{mount ? '🐾' : 'GC'}</span>
      <span>
        {mount ? (
          resolveI18nKey(ANIMAL_DESIGNS[mount.kind].name).toUpperCase()
        ) : (
          <>
            {t('adventureDuoLine1')}
            <br />
            {t('adventureDuoLine2')}
          </>
        )}
      </span>
    </div>
  )
}
