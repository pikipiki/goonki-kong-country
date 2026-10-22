import type { PointerEvent } from 'react'
import type { Key } from '../game/engine'
import type { Controls } from '../game/input'
import { ActionButtonView } from './ActionButtonView'
import { handleActionButtonClick } from './actionButtonClick'
import { pressActionButton } from './actionButtonHandlers'
import { useActionButtonReset } from './useActionButtonReset'

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
