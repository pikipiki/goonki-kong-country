import { emptyInput, type Game, type Input } from '../../src/game/engine'
import type { Controls } from '../../src/game/input'
/** Advance the simulation for a number of fixed steps (60 Hz). */
export function tickGame(game: Game, controls: Controls, frameCount = 1): void {
  for (let frame = 0; frame < frameCount; frame++) {
    game.update(controls.input)
  }
}
/** Deterministic frame advance for coverage tests (optional input and repeat count). */
export function advanceGame(
  game: Game,
  inputOrFrameCount?: Input | number,
  frameCount?: number,
): void {
  let input = emptyInput()
  let frames = 1
  if (typeof inputOrFrameCount === 'number') {
    frames = inputOrFrameCount
  } else if (inputOrFrameCount !== undefined) {
    input = inputOrFrameCount
    if (frameCount !== undefined) {
      frames = frameCount
    }
  }
  for (let frame = 0; frame < frames; frame++) {
    game.update(input)
  }
}
