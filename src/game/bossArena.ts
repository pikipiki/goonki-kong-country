/** The same visible deck limits are used by the engine and both renderers. */
export function bossArenaBounds(length: number) {
  return { left: 0, right: length, playerMin: 0.75, playerMax: length - 0.75 }
}

export const BOSS_BARREL_HEIGHT = 1.1
export const BOSS_CARRY = { x: 0.55, y: 1.35 }
