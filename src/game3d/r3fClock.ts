import type { RootState } from '@react-three/fiber'

/**
 * Compatible clock helper across R3F versions.
 * In R3F v9, timing was exposed via `state.clock`.
 * In R3F v10+, the scheduler provides `state.elapsed` and `state.time`.
 */
export type R3fClock = { elapsedTime: number; getElapsedTime(): number }

export function r3fClock(state: RootState | unknown): R3fClock {
  const s = state as
    | {
        clock?: { elapsedTime: number; getElapsedTime?(): number }
        elapsed?: number
        time?: number
      }
    | null
    | undefined

  if (s?.clock && typeof s.clock.elapsedTime === 'number') {
    return {
      elapsedTime: s.clock.elapsedTime,
      getElapsedTime: () =>
        typeof s.clock?.getElapsedTime === 'function'
          ? s.clock.getElapsedTime()
          : s.clock!.elapsedTime,
    }
  }

  const elapsed =
    typeof s?.elapsed === 'number'
      ? s.elapsed
      : typeof s?.time === 'number'
        ? s.time / 1000
        : typeof performance !== 'undefined'
          ? performance.now() / 1000
          : 0

  return {
    elapsedTime: elapsed,
    getElapsedTime: () => elapsed,
  }
}
