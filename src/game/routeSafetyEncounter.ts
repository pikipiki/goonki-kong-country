import type { EnemySpec } from './levels'
import { terrainSolidSpans } from './terrainSolids'
import { mineBirdHasCloseBee } from './routeSafetyPatrol'

function spanTop(span: { top: number }) {
  return span.top
}

function descendingFootY(left: number, right: number) {
  return right - left
}

function raiseUntilClear(worldX: number, startY: number): number {
  let footY = startY

  for (let attempt = 0; attempt < 16; attempt++) {
    const overlaps = [worldX - 0.45, worldX, worldX + 0.45]
      .flatMap((sampleX) => terrainSolidSpans('mineCart', sampleX))
      .filter((span) => footY - 0.6 < span.top && footY + 1.32 > span.bottom)

    if (!overlaps.length) {
      break
    }

    footY = Math.max(...overlaps.map(spanTop)) + 0.62
  }

  return footY
}

function adjustClusteredBee(
  enemies: readonly EnemySpec[],
  result: EnemySpec[],
  index: number,
  isUpper: boolean,
): void {
  const enemy = enemies[index]

  const floors = terrainSolidSpans('mineCart', enemy.x)
    .map(spanTop)
    .filter((footY) => footY <= enemy.y + 0.5)
    .sort(descendingFootY)

  const floorY = floors.at(0)

  if (floorY == null) {
    return
  }

  let footY
  if (isUpper) {
    footY = Math.max(enemy.y, floorY + 5.2)
  } else {
    footY = Math.max(floorY + 0.1, enemy.y - 0.4)
  }

  if (isUpper) {
    footY = raiseUntilClear(enemy.x, footY)
  }

  result[index].y = footY
  result[index].hoverAmplitude = 0
}

function adjustBirdCorridorBees(
  enemies: readonly EnemySpec[],
  result: EnemySpec[],
  bird: EnemySpec,
): void {
  for (let index = 0; index < enemies.length; index++) {
    const bee = enemies[index]

    if (
      bee.kind !== 'bee' ||
      bee.pattern === 'necky' ||
      bee.x <= bird.x ||
      bee.x - bird.x >= 12
    ) {
      continue
    }

    let footY = Math.max(result[index].y, bird.y + 5)

    for (let attempt = 0; attempt < 16; attempt++) {
      const overlaps = [bee.x - 0.6, bee.x, bee.x + 0.6]
        .flatMap((sampleX) => terrainSolidSpans('mineCart', sampleX))
        .filter((span) => footY - 0.15 < span.top && footY + 1.35 > span.bottom)

      if (!overlaps.length) {
        break
      }

      footY = Math.max(...overlaps.map(spanTop)) + 0.2
    }

    result[index].y = footY
    result[index].hoverAmplitude = 0
  }
}

/** Mobile cart adaptation, applied to runtime copies only. Nearby low/high
 * Keep a low jump obstacle, a clear overhead corridor, and predictable height.
 * Source metadata and intentional same-column stacks remain unchanged.
 */
export function mineEncounterClearance(
  enemies: readonly EnemySpec[],
): EnemySpec[] {
  const result = enemies.map((enemy) => ({ ...enemy }))

  const bees = enemies
    .map((enemy, index) => ({ enemy, index }))
    .filter(({ enemy }) => enemy.kind === 'bee' && enemy.pattern !== 'necky')
    .sort((left, right) => left.enemy.x - right.enemy.x)

  const clustered = new Set<number>()

  const upper = new Set<number>()

  for (let beeIdx = 1; beeIdx < bees.length; beeIdx++) {
    const enemy = bees[beeIdx].enemy

    const previous = bees[beeIdx - 1].enemy

    const deltaX = enemy.x - previous.x

    const deltaY = enemy.y - previous.y

    if (deltaX > 0.01 && deltaX < 6.5 && deltaY > 0 && deltaY < 3.5) {
      clustered.add(bees[beeIdx - 1].index)
      clustered.add(bees[beeIdx].index)
      upper.add(bees[beeIdx].index)
    }
  }

  for (const index of clustered) {
    adjustClusteredBee(enemies, result, index, upper.has(index))
  }

  const birds: EnemySpec[] = []

  for (const enemy of enemies) {
    if (mineBirdHasCloseBee(enemy, enemies)) {
      birds.push(enemy)
    }
  }

  for (const bird of birds) {
    adjustBirdCorridorBees(enemies, result, bird)
  }

  return result
}
