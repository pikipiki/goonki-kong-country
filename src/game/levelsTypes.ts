import type { AnimalSpawn } from './animals'

export type Biome =
  'jungle' | 'canopy' | 'mine' | 'lagoon' | 'snow' | 'temple' | 'ship'
export interface Platform {
  x: number
  y: number
  w: number
  h: number
  kind?: 'wood' | 'stone' | 'moving'
  travel?: number
}

export interface Pickup {
  x: number
  y: number
  kind: 'banana' | 'letter' | 'balloon'
  letter?: string
  amount?: number
}

export interface EnemySpec {
  x: number
  y: number
  min: number
  max: number
  kind: 'beetle' | 'croc' | 'bee' | 'armored' | 'boss'
  /** ROM Necky family: fixed X, vertical hover only. */
  pattern?: 'patrol' | 'necky'
  /** NutThrowingNecky (sprite 14) — not FlyingNecky / MiniNecky. */
  throwsNuts?: boolean
  /** Rev 2 sprite id when imported from spawn tables (Coral fish families). */
  romSpriteId?: number
  /** Horizontal patrol speed in world units/s when spawned. */
  patrolSpeed?: number
  /** Runtime mobile encounter adaptation; omitted keeps the regular hover. */
  hoverAmplitude?: number
}

export interface FinishZone {
  x: number
  y: number
  w: number
  h: number
}

export interface BonusRoomSpec {
  wallIndex: number
  /** i18n key. */
  label: string
  /** ROM sprite script $1375 at breakable-wall spawn (bonus routing hint). */
  romRam1375?: number
  romRam13E9?: number
  bounds: {
    x: number
    y: number
    w: number
    h: number
  }
  pickups: Pickup[]
}

export type CacheReward =
  | {
      kind: 'banana'
      amount?: number
    }
  | {
      kind: 'letter'
      letter: string
    }
  | {
      kind: 'balloon'
      amount?: number
    }
export interface ItemCacheSpec {
  x: number
  y: number
  reward: CacheReward
}

export interface BreakableWallSpec {
  x: number
  y: number
  w: number
  h: number
}

export interface LevelDecor {
  x: number
  y: number
  kind: 'butterfly' | 'sign' | 'token' | 'sparkle'
  /** Golden animal token; older source rows default to Expresso. */
  animal?: 'rambi' | 'enguarde' | 'winky' | 'expresso'
  /** i18n key when kind is sign. */
  text?: string
}

export interface BarrelSpec {
  x: number
  y: number
  kind: 'rescue' | 'checkpoint' | 'throw' | 'cannon'
  angle?: number
  rotationSpeed?: number
  /** Source bounded motion: speed is world units/s, bounds relative to spawn. */
  motion?: {
    axis: 'x' | 'y'
    minimum: number
    maximum: number
    speed: number
    activation: 'always' | 'occupied'
    diagonal?: boolean
  }
  autoFire?: boolean
  /** ROM $0FF5 launch multiplier; defaults to the verified base template (40). */
  launchMultiplier?: number
  /** Inclusive flight frames before gravity applies (ROM $0FC1 high byte). */
  cannonGravityDelay?: number
  /** Inclusive flight frames before steering applies (ROM $0FC1 low byte). */
  cannonControlDelay?: number
}

export interface Level {
  id: number
  /** i18n key (see src/i18n/keys.ts). */
  name: string
  /** i18n key. */
  subtitle: string
  biome: Biome
  length: number
  platforms: Platform[]
  pickups: Pickup[]
  enemies: EnemySpec[]
  barrels: BarrelSpec[]
  /** i18n key. */
  tip: string
  animals?: AnimalSpawn[]
  itemCaches?: ItemCacheSpec[]
  breakableWalls?: BreakableWallSpec[]
  bonusRooms?: BonusRoomSpec[]
  decors?: LevelDecor[]
  originalTerrain?: 'jungle' | 'coral' | 'cave' | 'mineCart'
  start?: {
    x: number
    y: number
  }
  letterWord?: string
  /** ROM ExitDoor trigger volume (world units). */
  finishZone?: FinishZone
}
