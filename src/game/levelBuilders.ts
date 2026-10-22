import type {
  BarrelSpec,
  Biome,
  EnemySpec,
  Level,
  Pickup,
  Platform,
} from './levelsTypes'

const DEFAULT_PLATFORM_HEIGHT = 4.4

const ELEVATED_PLATFORM_HEIGHT = 0.65

const WATER_PICKUP_WAVE_AMPLITUDE = 2

const GROUND_PICKUP_WAVE_AMPLITUDE = 0.5

export const platformAt = (
  posX: number,
  width: number,
  posY = 0,
  kind?: Platform['kind'],
): Platform => {
  let height
  if (posY === 0) {
    height = DEFAULT_PLATFORM_HEIGHT
  } else {
    height = ELEVATED_PLATFORM_HEIGHT
  }

  return {
    x: posX,
    y: posY,
    w: width,
    h: height,
    kind,
  }
}

export const enemyAt = (
  posX: number,
  min: number,
  max: number,
  kind: EnemySpec['kind'] = 'beetle',
  posY = 0,
): EnemySpec => ({ x: posX, y: posY, min, max, kind })
export function buildPickups(
  platforms: Platform[],
  length: number,
  water = false,
): Pickup[] {
  const items: Pickup[] = []

  platforms.forEach((ground, index) => {
    if (ground.w < 2) {
      return
    }

    for (let pick = 0; pick < Math.min(6, Math.floor(ground.w / 1.4)); pick++) {
      let waveAmplitude
      if (water) {
        waveAmplitude = WATER_PICKUP_WAVE_AMPLITUDE
      } else {
        waveAmplitude = GROUND_PICKUP_WAVE_AMPLITUDE
      }

      items.push({
        x: ground.x - ground.w * 0.34 + pick * 1.2,
        y: ground.y + 1.35 + Math.sin((pick / 5) * Math.PI) * waveAmplitude,
        kind: 'banana',
      })
    }

    if (index % 6 === 3) {
      items.push({ x: ground.x, y: ground.y + 3.8, kind: 'balloon' })
    }
  })
  // Each letter rests above an actual reachable platform, including moving ones.
  'GOONK'.split('').forEach((letter, index) => {
    const target = length * (0.13 + index * 0.17)

    const surface = platforms.reduce((best, next) => {
      if (Math.abs(next.x - target) < Math.abs(best.x - target)) {
        return next
      }

      return best
    }, platforms[0])

    items.push({ x: surface.x, y: surface.y + 2.3, kind: 'letter', letter })
  })
  return items
}

export function makeLevel(
  levelId: number,
  name: string,
  subtitle: string,
  biome: Biome,
  length: number,
  platforms: Platform[],
  enemies: EnemySpec[],
  barrels: BarrelSpec[],
  tip: string,
): Level {
  const pickups: Pickup[] =
    biome === 'ship' ? [] : buildPickups(platforms, length, biome === 'lagoon')

  return {
    id: levelId,
    name,
    subtitle,
    biome,
    length,
    platforms,
    // A single broad boss deck must not generate five overlapping letters
    // and invisible banana rewards behind the battle renderer.
    pickups,
    enemies,
    barrels,
    tip,
  }
}
