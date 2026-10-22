/** K. Rool sequence families/counts follow USA Rev2 DATA_B6EB45.
 * Durations and world velocities are adapted to plush-sized mobile play. */
export type BossPhase =
  | 'intro'
  | 'throw'
  | 'catch'
  | 'run'
  | 'jump'
  | 'rain'
  | 'hurt'
  | 'fakeDeath'
  | 'getUp'
  | 'dead'
export interface BossActor {
  x: number
  y: number
  vx: number
  vy: number
  min: number
  max: number
  hp: number
  vulnerable: boolean
  bossState?: BossPhase
  bossFacing?: number
  bossCrowned?: boolean
}

export interface BossProjectile {
  kind: 'crown' | 'cannonball'
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
  width: number
  height: number
  age: number
  warning: number
  returning: boolean
  rotation: number
  motionClock?: number
  bounces?: number
  impact?: number
}

export interface BossBattle {
  phase: BossPhase
  phaseTime: number
  hits: number
  maxHits: number
  crowned: boolean
  facing: number
  left: number
  right: number
  passes: number
  jumps: number
  hopTime: number
  rainCount: number
  spawned: number
  ballClock: number
  afterJumps: 'rain' | 'throw'
  totalTime: number
  hurtSoundPlayed?: boolean
}

export const BOSS_MAX_HITS = 10
