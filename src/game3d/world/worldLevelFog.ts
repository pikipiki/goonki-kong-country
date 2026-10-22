import type { Level } from '../../game/levels'
import { pick } from '../../utils/pick'

export function worldFogNear(level: Level): number {
  return pick(level.originalTerrain === 'coral', 18, 29)
}

export function worldFogFar(level: Level): number {
  return pick(level.originalTerrain === 'coral', 58, 77)
}

export function worldHemiSky(level: Level): string {
  return pick(level.biome === 'lagoon', '#9dcedb', '#d5dfbd')
}

export function worldAmbient(level: Level): number {
  return pick(level.biome === 'lagoon', 0.3, 0.12)
}

export function worldFillColor(level: Level): string {
  return pick(level.biome === 'lagoon', '#5faccc', '#7aa77a')
}
