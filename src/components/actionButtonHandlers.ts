import type { Key } from '../game/engine'
import type { Controls } from '../game/input'
import { controlFeedback } from './controlFeedback'

export function releaseDelay(action: Key, repeatable: boolean): number {
  if (repeatable) {
    return 65
  }
  if (action === 'jump') {
    return 350
  }
  return 90
}

export function pressActionButton(
  controls: Controls,
  source: string,
  action: Key,
  latched: boolean,
  active: boolean,
  repeatable: boolean,
  clickMode: boolean,
  timer: { current: ReturnType<typeof setTimeout> | undefined },
) {
  if (repeatable) {
    clearTimeout(timer.current)
    controls.set('screen-action', 'action', false)
    controls.set(source, action, false)
  }
  let next
  if (latched) {
    next = !active
  } else {
    next = true
  }
  controls.set(source, action, next)
  controlFeedback()
  if ((clickMode || repeatable) && !latched) {
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => {
        controls.set(source, action, false)
      },
      releaseDelay(action, repeatable),
    )
  }
}
