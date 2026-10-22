import type { PointerEvent } from 'react'
import { ActionButtonCharge } from './ActionButtonCharge'
import { pick } from '../utils/pick'

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
      className={`game-button ${className} ${pick(active, 'is-down', '')}`}
      aria-label={title}
      title={title}
      aria-pressed={pick(latched, active, undefined)}
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
