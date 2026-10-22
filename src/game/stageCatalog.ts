import { clamp } from './engine/math'
import { finalBossStageId, demo2DStageIds } from '../config/stages.json'
import { LEVELS, type Level } from './levels'
import { ROM_JUNGLE } from './originalJungle'
import { ROM_REVERB } from './originalReverb'
import { ROM_MINE_CART } from './originalMineCart'
import { ROM_CORAL } from './originalCoral'

/** Stable numeric IDs are save keys. Append stages; keep existing IDs stable. */
export const ORIGINAL_LEVELS: Level[] = [
  ROM_JUNGLE,
  ROM_REVERB,
  ROM_MINE_CART,
  ROM_CORAL,
  ...LEVELS.slice(4),
]
export const FINAL_BOSS_STAGE_ID = finalBossStageId

export function normalizeStageId(levelId: number): number {
  return Number.isFinite(levelId)
    ? clamp(Math.trunc(levelId), 0, LEVELS.length - 1)
    : 0
}

export function stageAt(levelId: number, original: boolean): Level {
  const catalog = original ? ORIGINAL_LEVELS : LEVELS
  return catalog[normalizeStageId(levelId)]
}

export function isDemo2DStage(levelId: number): boolean {
  return demo2DStageIds.includes(levelId)
}
export function isOriginalStage(levelId: number): boolean {
  return ORIGINAL_LEVELS[levelId] !== LEVELS[levelId]
}
