import type { RootState } from '@react-three/fiber'

/**
 * Compatible clock helper across R3F versions.
 * In R3F v9, timing was exposed via `state.clock`.
 * In R3F v10+, the scheduler provides `state.elapsed` and `state.time`.
 */
export type R3fClock = { elapsedTime: number; getElapsedTime(): number }

type R3fTimingState = RootState & {
  clock?: { elapsedTime: number; getElapsedTime?(): number }
  elapsed?: number
  time?: number
}

function elapsedFromState(state: R3fTimingState): number {
  if (typeof state.elapsed === 'number') {
    return state.elapsed
  }
  if (typeof state.time === 'number') {
    return state.time / 1000
  }
  if (typeof performance !== 'undefined') {
    return performance.now() / 1000
  }
  return 0
}

export function r3fClock(state: RootState): R3fClock {
  const timing = state as R3fTimingState
  const legacy = timing.clock
  if (legacy && typeof legacy.elapsedTime === 'number') {
    const elapsedTime = legacy.elapsedTime
    return {
      elapsedTime,
      getElapsedTime: () =>
        typeof legacy.getElapsedTime === 'function'
          ? legacy.getElapsedTime()
          : elapsedTime,
    }
  }

  const elapsed = elapsedFromState(timing)
  return {
    elapsedTime: elapsed,
    getElapsedTime: () => elapsed,
  }
}
