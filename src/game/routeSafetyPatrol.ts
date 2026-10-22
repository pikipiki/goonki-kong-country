import type { EnemySpec } from './levels'
/** A forced bird rebound needs a landing corridor before the next Zinger. */
export function mineBirdHasCloseBee(
  bird: EnemySpec,
  enemies: readonly EnemySpec[],
): boolean {
  return (
    bird.pattern === 'necky' &&
    enemies.some(
      (enemy) =>
        enemy.kind === 'bee' &&
        enemy.pattern !== 'necky' &&
        enemy.x > bird.x &&
        enemy.x - bird.x < 12,
    )
  )
}
/** The imported table gives spawn anchors, not patrols across the whole level.
 * Keep real Zingers in short non-overlapping sectors so their encounter order
 * and the time available to recover between jumps remain stable.
 * Stacked source hazards share a sector; Neckys already have fixed source X.
 */
export function mineBeePatrolBounds(
  enemy: EnemySpec,
  enemies: readonly EnemySpec[],
  length: number,
): {
  min: number
  max: number
} {
  const anchors = enemies
    .filter(
      (spec) =>
        spec.kind === 'bee' &&
        spec.pattern !== 'necky' &&
        Math.abs(spec.x - enemy.x) > 0.01,
    )
    .map((spec) => spec.x)
  const before = Math.max(0, ...anchors.filter((anchor) => anchor < enemy.x))
  const after = Math.min(
    length,
    ...anchors.filter((anchor) => anchor > enemy.x),
  )
  return {
    min: Math.max(0, enemy.x - 0.6, (before + enemy.x) / 2 + 0.15),
    max: Math.min(length, enemy.x + 0.6, (after + enemy.x) / 2 - 0.15),
  }
}
