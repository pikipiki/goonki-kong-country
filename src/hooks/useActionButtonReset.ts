import { useEffect, useRef } from 'react'
import type { Key } from '../game/engine'
import type { Controls } from '../game/input'

export function useActionButtonReset(
  controls: Controls,
  source: string,
  action: Key,
  clickMode: boolean,
  chargeable: boolean,
  sustained: boolean,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(timer.current)
    controls.set(source, action, false)
  }, [clickMode, chargeable, sustained, controls, source, action])
  useEffect(
    () => () => {
      clearTimeout(timer.current)
      controls.set(source, action, false)
    },
    [controls, source, action],
  )
  return timer
}
