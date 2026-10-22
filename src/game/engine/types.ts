import type { EnemySpec } from '../levels'
import type { BossPhase } from '../bossBattle'

export interface TeamSwap {
  remaining: number
  back: {
    x: number
    y: number
    facing: number
  }
}

export type Key =
  'left' | 'right' | 'jump' | 'action' | 'swap' | 'run' | 'up' | 'down'
export type Phase =
  'title' | 'playing' | 'paused' | 'map' | 'clear' | 'gameover' | 'victory'
export interface Input {
  held: Set<Key>
  pressed: Set<Key>
  released: Set<Key>
  /** True when the mobile UI is in tap-to-toggle mode (see GameControls). */
  clickMode?: boolean
  /** Screen action presses pick up / throw on separate taps, independently of steering mode. */
  tapAction?: boolean
}

export interface Enemy extends EnemySpec {
  bossState?: BossPhase
  bossFacing?: number
  bossCrowned?: boolean
  originY: number
  vx: number
  alive: boolean
  hp: number
  vy: number
  timer: number
  hurt: number
  vulnerable: boolean
  shootCooldown: number
}

export interface Particle {
  x: number
  y: number
  age: number
  text: string
  color: string
}

export interface Thrown {
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
}

export interface EnemyShot {
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
}

export interface Save {
  unlocked: number
  best: Record<
    string,
    {
      bananas: number
      letters: number
      time: number
    }
  >
}

export interface Player {
  x: number
  y: number
  vx: number
  vy: number
  facing: number
  grounded: boolean
  active: number
  hp: number
  invincible: number
  roll: number
  rollJump: boolean
  rollJumpMomentum: number
  /** Complete the forced rebound before the next mine Zinger, even after a short tap. */
  cartRebound: boolean
  rollSpeed: number
  rollFacing: number
  rollChain: number
  rollAngle: number
  recentRun: number
  mount: number
  mountAttack: number
  mountCharge: number
  mountCharged: boolean
  mountCooldown: number
  carry: number
  cannon: number
  cannonLock: number
  cannonTime: number
  launched: number
  cannonGravityDelay: number
  cannonControlDelay: number
  jumpDelay: number
  coyote: number
  buffer: number
}
