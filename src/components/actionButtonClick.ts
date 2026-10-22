import type { Key } from '../game/engine'
import type { Controls } from '../game/input'

export function handleActionButtonClick(
  controls: Controls,
  source: string,
  action: Key,
  latched: boolean,
  repeatable: boolean,
  timer: {
    current: ReturnType<typeof setTimeout> | undefined
  },
) {
  clearTimeout(timer.current)
  if (repeatable) {
    controls.set('screen-action', 'action', false)
    controls.set(source, action, false)
  }
  if (latched) {
    controls.set(source, action, !controls.input.held.has(action))
    return
  }
  controls.set(source, action, true)
  timer.current = setTimeout(() => {
    controls.set(source, action, false)
  }, 100)
}
