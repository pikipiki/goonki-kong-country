import { type PointerEvent } from 'react'
import { type Key } from '../game/engine'
import { type Controls } from '../game/input'
import { handleActionButtonClick } from './actionButtonClick'
import { pressActionButton } from './actionButtonHandlers'
import { useActionButtonReset } from './useActionButtonReset'
import { useTranslation } from 'react-i18next'
import { cssPercent } from '../utils/cssUnits'
type ActionButtonProps = {
  controls: Controls
  action: Key
  title: string
  glyph: string
  className?: string
  clickMode?: boolean
  chargeable?: boolean
  chargeProgress?: number
  sustained?: boolean
  repeatable?: boolean
}

export function ActionButton(props: ActionButtonProps) {
  const {
    controls,
    action,
    title,
    glyph,
    className = '',
    clickMode = false,
    chargeable = false,
    chargeProgress = 0,
    sustained = false,
    repeatable = false,
  } = props
  const source = `screen-${action}`
  const latched = chargeable || sustained
  const active = controls.sources.get(source) === action
  const timer = useActionButtonReset(
    controls,
    source,
    action,
    clickMode,
    chargeable,
    sustained,
  )
  const release = () => {
    if (!latched && !clickMode) {
      controls.set(source, action, false)
    }
  }
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pressActionButton(
      controls,
      source,
      action,
      latched,
      active,
      repeatable,
      clickMode,
      timer,
    )
  }
  return (
    <ActionButtonView
      source={source}
      clickMode={clickMode}
      latched={latched}
      active={active}
      className={className}
      title={title}
      glyph={glyph}
      chargeable={chargeable}
      chargeProgress={chargeProgress}
      onPointerDown={onPointerDown}
      release={release}
      onPointerCancel={() => {
        clearTimeout(timer.current)
        controls.set(source, action, false)
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          handleActionButtonClick(
            controls,
            source,
            action,
            latched,
            repeatable,
            timer,
          )
        }
      }}
    />
  )
}

export function ActionButtonView({
  source,
  clickMode,
  latched,
  active,
  className,
  title,
  glyph,
  chargeable,
  chargeProgress,
  onPointerDown,
  release,
  onPointerCancel,
  onClick,
}: {
  source: string
  clickMode: boolean
  latched: boolean
  active: boolean
  className: string
  title: string
  glyph: string
  chargeable: boolean
  chargeProgress: number
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  release: () => void
  onPointerCancel: () => void
  onClick: (event: PointerEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      key={`${source}-${String(clickMode)}-${String(latched)}`}
      className={`game-button ${className} ${active ? 'is-down' : ''}`}
      aria-label={title}
      title={title}
      aria-pressed={latched ? active : undefined}
      onContextMenu={(event) => {
        event.preventDefault()
      }}
      onPointerDown={onPointerDown}
      onPointerUp={release}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={release}
      onClick={onClick}
    >
      {chargeable && <ActionButtonCharge chargeProgress={chargeProgress} />}
      <span className="button-glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="button-caption">{title}</span>
    </button>
  )
}

export function ActionButtonCharge({
  chargeProgress,
}: {
  chargeProgress: number
}) {
  const { t } = useTranslation()
  return (
    <span
      className="charge-progress"
      role="progressbar"
      aria-label={t('chargePower')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(chargeProgress * 100)}
      style={{ height: cssPercent(chargeProgress * 100) }}
    />
  )
}
