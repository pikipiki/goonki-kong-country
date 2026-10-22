import type { RootState } from '@react-three/fiber'

/** R3F still exposes `clock` at runtime; current fiber typings omit it on RootState. */
export type R3fClock = { elapsedTime: number; getElapsedTime(): number }

export function r3fClock(state: RootState): R3fClock {
  return (state as RootState & { clock: R3fClock }).clock
}
