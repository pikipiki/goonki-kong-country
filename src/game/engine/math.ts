import { rawSpeed } from './romPhysics'

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))
export const approach = (value: number, target: number, maxDelta: number) =>
  value + clamp(target - value, -maxDelta, maxDelta)
// Rev 2 Jungle traces: move 1/8 of the signed velocity error, quantized to 8.8.
// The fixed-step Director calls this once per 60 Hz simulation update.
export const approachFootVelocity = (value: number, target: number) => {
  const raw = Math.round(value / rawSpeed(1))

  const targetRaw = Math.round(target / rawSpeed(1))

  const error = targetRaw - raw

  const step = Math.abs(error) >> 3

  return rawSpeed(raw + (step === 0 ? error : Math.sign(error) * step))
}

/** Narrow hooks for Vitest branch coverage (ROM foot velocity quantization). */
export function testApproachFootVelocity(value: number, target: number) {
  return approachFootVelocity(value, target)
}
