import { describe, expect, it } from 'vitest'
import { cannonLaunchVelocity, romSwimIdleSink } from '../src/game/engine'
describe('exported swim and cannon helpers', () => {
  it('covers idle sink fallback and defined motion', () => {
    expect(romSwimIdleSink()).toBe(0.85)
    expect(
      romSwimIdleSink({
        verticalSwim: {
          sinkAccelerationWorldPerSecond: 1,
          riseSpeedWorld: 1,
          diveSpeedWorld: 1,
        },
      }),
    ).toBe(0.85)
    expect(
      romSwimIdleSink({
        verticalSwim: {
          sinkAccelerationWorldPerSecond: 1,
          riseSpeedWorld: 1,
          diveSpeedWorld: 1,
          idleSinkSpeedWorld: 1.1,
        },
      }),
    ).toBe(1.1)
  })
  it('picks non-default cannon vectors for oblique aims', () => {
    const straight = cannonLaunchVelocity(0)
    const upRef = cannonLaunchVelocity(Math.PI / 2)
    expect(straight.vx).not.toBe(upRef.vx)
    expect(Math.hypot(upRef.vx, upRef.vy)).toBeGreaterThan(0)
  })
})
