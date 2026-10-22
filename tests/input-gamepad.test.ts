import { afterEach, describe, expect, it, vi } from 'vitest'
import { Controls } from '../src/game/input'
afterEach(() => {
  vi.unstubAllGlobals()
})
describe('Controls.gamepad', () => {
  it('handles missing, empty, and partial gamepad state', () => {
    const controls = new Controls()
    vi.stubGlobal('navigator', {})
    controls.gamepad()
    expect(controls.input.held.size).toBe(0)
    vi.stubGlobal('navigator', { getGamepads: () => [] })
    controls.gamepad()
    expect(controls.input.held.size).toBe(0)
    vi.stubGlobal('navigator', {
      getGamepads: () => [
        null,
        {
          axes: [undefined as unknown as number, 0],
          buttons: [{ pressed: false }, { pressed: true }],
        },
      ],
    })
    controls.gamepad()
    expect(controls.input.held.has('swap')).toBe(true)
    vi.stubGlobal('navigator', {
      getGamepads: () => [
        {
          axes: [0, 0],
          buttons: [
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: false },
            { pressed: true },
            { pressed: false },
          ],
        },
      ],
    })
    controls.gamepad()
    expect(controls.input.held.has('left')).toBe(true)
  })
})
