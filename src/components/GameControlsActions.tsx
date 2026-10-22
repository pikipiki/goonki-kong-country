import { mountAction } from '../config/gameplay.json'
import { useTranslation } from 'react-i18next'
import { type Game } from '../game/engine'
import { type Controls } from '../game/input'
import { ActionButton } from './ActionButton'
import { jumpActionTitle, primaryActionTitle } from './gameControlCopy'
export function GameControlsActions({
  game,
  controls,
  clickMode,
}: {
  game: Game
  controls: Controls
  clickMode: boolean
}) {
  const { t } = useTranslation()
  const actionKey = [
    game.levelId,
    game.sceneRevision,
    game.player.mount,
    game.player.cannon,
  ].join('-')
  const chargeMount =
    game.mount?.kind === 'rambi' || game.mount?.kind === 'enguarde'

  return (
    <div className="action-cluster">
      <ActionButton
        controls={controls}
        action="swap"
        title={game.mount ? t('dismount') : t('swapBuddy')}
        glyph="⇄"
        className="swap-button"
        clickMode={clickMode}
      />
      <ActionButton
        controls={controls}
        key={`action-${actionKey}`}
        action="action"
        title={primaryActionTitle(game, t)}
        glyph="✦"
        className="action-button"
        chargeable={chargeMount}
        chargeProgress={Math.min(
          1,
          game.player.mountCharge / mountAction.readyChargeSeconds,
        )}
        clickMode={clickMode}
      />
      <ActionButton
        controls={controls}
        key={`jump-${actionKey}`}
        action="jump"
        title={jumpActionTitle(game, controls, t)}
        glyph={game.mount?.kind === 'enguarde' ? '➜' : '↑'}
        repeatable={game.mount?.kind === 'enguarde'}
        className="jump-button"
        sustained={game.mount?.kind === 'expresso'}
        clickMode={clickMode}
      />
    </div>
  )
}
