/** The same visible deck limits are used by the engine and both renderers. */
export function bossArenaBounds(length: number) {
  return {left: 0, right: length, playerMin: .75, playerMax: length - .75};
}
export const BOSS_BARREL_HEIGHT = 1.1;
export const BOSS_CARRY = {x: .55, y: 1.35};
