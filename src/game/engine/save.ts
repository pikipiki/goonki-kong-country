import { LEVELS } from '../levels'
import { clamp } from './math'
import type { Save } from './types'

// Storage is untrusted input. Reject oversized payloads before parsing them.
const MAX_SAVE_CHARACTERS = 16_384
const MAX_BANANA_SCORE = 1_000_000
const MAX_STAGE_SECONDS = 7 * 24 * 60 * 60
export const defaultSave = (): Save => ({ unlocked: 0, best: {} })

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function boundedNumber(value: unknown, maximum: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= maximum
  )
}
function readStageBest(
  value: unknown,
  maxLetters: number,
): Save['best'][string] | undefined {
  if (!isRecord(value)) return undefined
  const { bananas, letters, time } = value
  if (
    !boundedNumber(bananas, MAX_BANANA_SCORE) ||
    !Number.isInteger(bananas) ||
    !boundedNumber(letters, maxLetters) ||
    !Number.isInteger(letters) ||
    !boundedNumber(time, MAX_STAGE_SECONDS)
  )
    return undefined
  // Copy known fields only: no prototype keys or extra nested objects survive.
  return { bananas, letters, time }
}
export function readSave(text: string | null): Save {
  if (text && text.length > MAX_SAVE_CHARACTERS) return defaultSave()
  try {
    const raw: unknown = JSON.parse(text ?? '{}')
    if (
      !isRecord(raw) ||
      !Number.isInteger(raw.unlocked) ||
      !isRecord(raw.best)
    )
      return defaultSave()
    const best: Save['best'] = {}
    for (const level of LEVELS) {
      const key = String(level.id)
      const score = readStageBest(
        raw.best[key],
        (level.letterWord ?? 'GOONK').length,
      )
      if (score) best[key] = score
    }
    return {
      unlocked: clamp(raw.unlocked as number, 0, LEVELS.length - 1),
      best,
    }
  } catch {
    return defaultSave()
  }
}
