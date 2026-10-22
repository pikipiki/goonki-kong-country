import { LEVELS } from '../levels'
import { clamp } from './math'
import type { Save } from './types'

export const defaultSave = (): Save => ({ unlocked: 0, best: {} })
export function readSave(text: string | null): Save {
  try {
    const raw: unknown = JSON.parse(text ?? '{}')
    if (!raw || typeof raw !== 'object') {
      return defaultSave()
    }
    const record = raw as Record<string, unknown>
    const unlocked = record.unlocked
    if (!Number.isInteger(unlocked)) {
      return defaultSave()
    }
    const bestRaw = record.best
    if (!bestRaw || typeof bestRaw !== 'object') {
      return defaultSave()
    }
    const best: Save['best'] = {}
    for (const [key, item] of Object.entries(bestRaw)) {
      if (
        item &&
        typeof item === 'object' &&
        Number.isFinite((item as Save['best'][string]).bananas) &&
        Number.isFinite((item as Save['best'][string]).letters) &&
        Number.isFinite((item as Save['best'][string]).time)
      ) {
        best[key] = item as Save['best'][string]
      }
    }
    return { unlocked: clamp(unlocked as number, 0, LEVELS.length - 1), best }
  } catch {
    return defaultSave()
  }
}
